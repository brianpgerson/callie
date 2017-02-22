'use strict';
var Slackbot = require('slackbots');
var Countdown = require('./models/countdown');
var utils = require('./utils');
var presets = require('../data/presets');
var _ = require('lodash');
var moment = require('moment');
var nodeSchedule = require('node-schedule');

class CountdownBot extends Slackbot {

 	constructor(settings) {
 		super(settings);
 		this.chronJobs = {};
 		this.openers = presets.openers;
		this.enders = presets.enders;
	    this.user = null;
	}

	run () {
	    this.on('start', this._onStart);
	    this.on('message', this._onMessage);
	}

	hello (channel) {
		this._sayHello({channel: channel});
	}

	_onStart () {
	    this.user = _.filter(this.users, function (user) {
	        return user.name === this.self.name;;
	    }.bind(this))[0];
	}

	_onMessage (message) {
	    if (utils.isValidMessage(message, this.user.id)) {
        	var type = utils.extractType(message);
        	switch (type) {
        		case 'help':
        			this._sendHelpResponse(message);
        			break;
        		case 'start':
        			var settings = utils.extractSettings(message, 'date');
        			this._startCountdown(settings, message);
        			break;
        		case 'reset':
        			var settings = utils.extractSettings(message, 'date');
        			this._resetCountdown(settings, message);
        			break;
        		case 'schedule':
        			var settings = utils.extractSettings(message, 'schedule');
        			this._reformatChron(settings, message);
        			break;
        		case 'cancel':
        			var settings = utils.extractSettings(message, 'event');
        			this._cancelChron(settings, message);
        			break;
        		case 'delete':
        			var settings = utils.extractSettings(message, 'event');
        			this._deleteCountdown(settings, message);
        			break;
        		case 'list':
        			this._listTeamEvents(message);
        			break;
        		case 'countdown':
        			var settings = utils.extractSettings(message, 'countdown');
        			this._replyToChannel(settings, message);
        			break;
        		case 'hello':
        			this._sayHello(message);
        			break;
        		default:
        			if (message.text.length > `<@${this.user.id}>`.length) {
        				message.text = _.trim(message.text.slice(`<@${this.user.id}>`.length));
	    				this._randomRepliesToChannel(message);
        			}
        	}
    	}
	}

	_sayHello(message) {
		this.postMessage(message.channel, presets.sayHello, {as_user: 'callie'});
	}

	_listTeamEvents (message) {
		Countdown.find({teamId: message.team}).then(function (countdowns) {
			var events = _.map(countdowns, function (countdown, index) {
				return `${index + 1}: ${countdown.event} _on_ ${moment(countdown.date).calendar()}`;
			});


			var reply = events.length > 0 ?
				`Your events:\n ${events.join('\n')}` :
				`You haven't listed any events yet! Ask for 'help' if you're having a ...ruff time!`;

			this.postMessage(message.channel, reply, {as_user: this.user.name});
		}.bind(this));
	}

	_sendHelpResponse (message) {
		var helpMessage = `Happy to help! ${presets.help}`;
		this.postMessage(message.channel, helpMessage, {as_user: this.user.name});
	}

	_randomRepliesToChannel(message) {
		const dogSounds = ['arf', 'bark', 'woof', 'ruff', 'grrr'];
		if (dogSounds.indexOf(message.text.toLowerCase()) >= 0) {
			this.postMessage(message.channel, utils.pickRandom(dogSounds) + '!', {as_user: this.user.name});
		} else {
			this.postMessage(message.channel,
				'Sorry, didn\'t quite catch that. Try again, or ask for "help". Woof woof.',
				{as_user: this.user.name});
		}
	}

	_replyToChannel (settings, message) {
	    this._generateResponse(settings, message).then(function(response) {
	    	if (!!response) {
    			this.postMessage(message.channel, response, {as_user: this.user.name});
	    	}
	    }.bind(this));

	}

	_generateResponse (settings, message) {
		return Countdown.findOne({teamId: message.team, event: settings.countdown}).then(function(countdown) {
			if (!countdown) {
    			this.postMessage(message.channel,
    				`Oh no! No countdown found for your event: ${message.text}`,
    				{as_user: this.user.name});
    			return;
			}

			var generatedMessage = `${utils.pickRandom(this.openers)} ${moment(countdown.date).diff(new Date(), 'days')} days`;
			var event = countdown.event;
			var destination = countdown.destination;
			destination = countdown.destination === 'cities' ? utils.pickRandom(presets.cities) : countdown.destination;

			return this._buildGeneratedMessage(generatedMessage, event, destination);
		}.bind(this));
	}

	_buildGeneratedMessage(generatedMessage, event, destination) {
		if (!!destination && !!event) {
			generatedMessage += ` ${utils.pickRandom(this.enders)} trip to ${destination} for ${event}`;
		} else if (!!event) {
			generatedMessage += ` until ${event}`;
		} else if (!!destination) {
			generatedMessage += ` ${utils.pickRandom(this.enders)} trip to ${destination}`;
		}

		return generatedMessage;
	}

	_startCountdown(newSettings, message) {
		if (!utils.isValidCountdown(newSettings, message)) {
			var error = 'You must set both an event and a date.';
			this.postMessage(message.channel, error, {as_user: this.user.name});
			return;
		}

		Countdown.findOne({teamId: message.team, event: newSettings.event})
			.then(function(countdown) {
				if (!!countdown) {
					this.postMessage(message.channel,
						`There's already a countdown for ${countdown.event}!`,
						{as_user: this.user.name});
				} else {
					this._saveCountdown(newSettings, message);
				}
			}.bind(this));
	}

	_resetCountdown(newSettings, message) {
		if (!utils.isValidCountdown(newSettings, message)) {
			return;
		}

		_.assign(newSettings, {schedule: {rule: '* * 10 * * 1', active: true}});
		this._updateCountdown(
			{teamId: message.team, event: newSettings.event},
			newSettings,
			message,
			'I\'ve updated your event and started a new weekly countdown!'
		);
	}

	_saveCountdown(newSettings, message) {
		var scheduleId = message.team + newSettings.event.split(' ').join('');
		var newCountdown = new Countdown({
			event: newSettings.event,
			botId: this.user.id,
			destination: newSettings.destination,
			date: newSettings.date,
			teamId: message.team,
			schedule: {
				id: scheduleId,
				rule: '* * * * * *',
				active: true
			}
		});

		newCountdown.save().then(function (countdown) {
			this.handleNewChronJob(countdown);
			this.postMessage(message.channel,
				`I've created your new countdown for ${countdown.event}!`,
				{as_user: this.user.name});
		}.bind(this)).catch(function (err) {
			console.error(err);
		});
	}

	_deleteCountdown (settings, message) {
		Countdown.findOneAndRemove(
	    {teamId: message.team, event: settings.event},
	    function (err, modifiedCountdown) {
	      	if (!!err) {
	        	return console.error(err);
				this.postMessage(message.channel,
					`There was an error deleting your countdown. Did you have the right event name?`,
					{as_user: this.user.name});
	      	} else if (!!modifiedCountdown) {
				this._removeChronJob(settings, message);
				this.postMessage(message.channel,
					`I've successfully removed ${settings.event} from your current countdowns.`,
					{as_user: this.user.name})
	      	}
 	 	}.bind(this));
	}

	_updateCountdown (query, updatedCountdown, message,
						successMessage = 'I\'ve updated your countdown!', successCb) {
		Countdown.findOneAndUpdate(
	    query,
	    updatedCountdown,
	    {runValidators: true},
	    function (err, modifiedCountdown) {
	      	if (!!err) {
	        	return console.error(err);
				this.postMessage(message.channel,
					`There was an error updating your countdown.`,
					{as_user: this.user.name});
	      	} else if (!!modifiedCountdown) {
	      		if (successCb) {
	      			successCb()
	      		}
				this.postMessage(message.channel,
					successMessage,
					{as_user: this.user.name})
	      	}
 	 	}.bind(this));
	}

	handleNewChronJob (countdown) {
		var self = this;
		var scheduled = nodeSchedule.scheduleJob(countdown.schedule.rule, function(){
			var reminder = `And now for your scheduled reminder: ${moment(countdown.date).diff(new Date(), 'days')} until ${countdown.event}!`;
			self.postMessage(message.channel, reminder, {as_user: self.user.name});
		});
		this.chronJobs[countdown.schedule.id] = scheduled;
	}

	_removeChronJob (settings, message) {
		var scheduleId = message.team + settings.event.split(' ').join('');
		this.chronJobs[scheduleId].cancel();
	}

	_reformatChron (settings, message) {
		// Default to Monday at 10am
		// format: [second, minute, hour, day of month, month, day of week]
		var chron = ['*', '*', 10, '*', '*', 1];

		var day = settings.day;
		var hour = settings.hour;
		var response, error;

		chron[2] = !!hour ? utils.handleHour(hour, chron[2], this) : chron[2];

		if (settings.schedule === 'weekly') {
			if (!!day) {
				chron[5] = utils.handleDay(day, chron[5]);
			}
			this._updateChron(settings, message, chron);
			response = `Updated weekly scheduled reminder to ${day ? _.upperFirst(day) : 'Monday'} at ${chron[2]}`;
		} else if (settings.schedule = 'daily') {
			chron[5] = '*';
			this._updateChron(settings, message, chron);
			response = `Updated to daily scheduled reminder at ${chron[2]}`;
		} else {
			error = 'I didn\'t quite get that. Try again, using "daily" or "weekly", or ask for help for more instructions.'
			this.postMessage(message.channel, error, {as_user: this.user.name});
			return;
		}
		this.postMessage(message.channel, response, {as_user: this.user.name});
	}

	_updateChron (settings, message, chron) {
		var rule = chron.join(' ');

		this._updateCountdown(
			{teamId: message.team, event: settings.event},
			{schedule: {rule: rule, active: true}},
			message);
	}

	_cancelChron (settings, message) {
		this._removeChronJob(settings, message);

		this._updateCountdown(
			{teamId: message.team, event: settings.event},
			{schedule: {active: false}},
			message,
			'I\'ve canceled your scheduled updates.');
	}
}

module.exports = CountdownBot;
