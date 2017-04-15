'use strict';

var Slackbot = require('slackbots');
var Countdown = require('./models/countdown');
var Bot = require('./models/bot');
var utils = require('./utils');
var presets = require('../data/presets');
var messageGenerator = require('./messageGenerator');
var _ = require('lodash');
var moment = require('moment');
var nodeSchedule = require('node-schedule');

class CountdownBot extends Slackbot {

 	constructor(settings) {
 		super(settings);
 		this.chronJobs = {};
	    this.user = null;
	}

	run () {
		this.on('error', function(data) {
			if (data.message.match(/account_inactive/)) {
   	 			console.log(`${data} for ${this.token}`);
	 			Bot.findOneAndRemove({botAccessToken: this.token}).then(function (bot) {
	 				console.log('bot removed!', bot);
	 			}).catch(function (err) {
	 				console.log('error removing bot', err);
	 			});
			}
		});
	    this.on('start', this._onStart);
	    this.on('message', this._onMessage);
	}

	hello (channel) {
		console.log('channel', channel);
		this._sayHello({channel: channel});
	}

	updateCountdown (countdown) {
		var channel = _.get(countdown, 'schedule.channel');
		var _this = this;
		this._updateCountdown(
			{teamId: countdown.teamId, event: countdown.event},
			utils.saveStupidBots(countdown),
			{channel: channel},
			false,
			function (updatedCountdown) {
				if (!_.isUndefined(channel)) {
					_this.handleNewChronJob(countdown, {channel: channel});
				}
			});

	}

	_onStart () {
	    this.user = _.filter(this.users, function (user) {
	        return user.name === this.self.name;;
	    }.bind(this))[0];
	}

	_onMessage (message) {
	    if (utils.isValidMessage(message, this.user.id)) {
	    	console.log('message received', message);
        	var type = utils.extractType(message);
        	switch (type) {
        		case 'help':
        			this._sendHelpResponse(message);
        			break;
        		case 'start':
        			var settings = utils.extractSettings(message, 'date');
        			if (settings.dumb) {
        				this._noDumbPlease(message);
        			} else {
        				this._startCountdown(settings, message);
        			}
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

	_noDumbPlease (message) {
		this.postMessage(message.channel, presets.nodumb, {as_user: 'callie'});
	}

	_sayHello (message) {
		console.log(message);
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

	isSillyType(type, message) {
		return type.indexOf(_.trim(message.text.toLowerCase(), '!,.?')) >= 0;
	}

	_randomRepliesToChannel(message) {
		const dogSounds = ['arf', 'bark', 'woof', 'ruff', 'grrr'];
		const dogCommands = ['sit', 'stay', 'speak', 'roll over', 'shake'];
		const confused = [
			`Sorry, didn\'t quite catch that. Try again, or ask for "help". Woof woof.`,
			`Hmmm... <wags tail> <tilts head in confusion> Ask for "help" if you're confused too!`,
			`That doesn\'t seem right. Do you need help? Just ask for it!`,
			`I just don't know what you're getting at with that. You messin' with me? Just cause I'm a cute lil corgi?`,
			`Hmmm, try something else. That didn't seem to match any of my expectations. Ask for "help" if you need it!`,
			`Arf! I am confused by your request. I am very smart for a corgi, but I am still a corgi, after all. Ask for "help" if you need it!`
		];

		if (this.isSillyType(dogSounds, message)) {
			this.postMessage(message.channel, utils.pickRandom(dogSounds) + '!', {as_user: this.user.name});
		} else if (this.isSillyType(dogCommands, message)) {
			this.postMessage(message.channel, `Dangit, I never learned how to ${message.text}. I only know how to count, read, write, and bark, embarrassingly enough.`, {as_user: this.user.name});
		} else {
			this.postMessage(message.channel,
				utils.pickRandom(confused),
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
    				`Oh no! No countdown found for an event called "${settings.countdown}". Try asking me for "list" to see your currently active countdowns.`,
    				{as_user: this.user.name});
    			return;
			}

			var eventDate = moment(countdown.date);
			var today = moment();

			var days = Math.ceil(eventDate.diff(today, 'hours') / 24)
			var event = countdown.event;
			var destination = countdown.destination;
			destination = countdown.destination === 'cities' ? utils.pickRandom(presets.cities) : countdown.destination;

			if (days <= 0) {
				this._deleteCountdown({event: event}, message, true);
				return `Hooray! Today is the day for ${event}! You lucky dowgs, you.`
			}

			return messageGenerator(days, event, destination);
		}.bind(this));
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

		_.assign(newSettings, {schedule: {rule: {hour: 10, dayOfWeek: 1}}});
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
				rule: {hour: 10, dayOfWeek: 1},
				channel: message.channel
			}
		});

		newCountdown.save().then(function (countdown) {
			this.handleNewChronJob(countdown, message);
			this.postMessage(message.channel,
				`I've created your new countdown for ${countdown.event}!`,
				{as_user: this.user.name});
		}.bind(this)).catch(function (err) {
			console.error(err);
		});
	}

	_deleteCountdown (settings, message, skipMessage) {
		Countdown.findOneAndRemove(
	    {teamId: message.team, event: settings.event},
	    function (err, modifiedCountdown) {
	      	if (!!err) {
	        	console.error(err);
				this.postMessage(message.channel,
					`There was an error removing your countdown. Did you have the right event name?`,
					{as_user: this.user.name});
	      	} else if (!!modifiedCountdown) {
				this._removeChronJob(settings, message);
				if (!skipMessage) {
					this.postMessage(message.channel,
						`I've successfully removed ${settings.event} from your current countdowns.`,
						{as_user: this.user.name})
				}
	      	}
 	 	}.bind(this));
	}

	_updateCountdown (query, updatedCountdown, message, successMessage = 'I\'ve updated your countdown!', successCb) {
		var name = _.get(this.user, 'name', this.name);
		Countdown.findOneAndUpdate(
		    query,
		    updatedCountdown,
		    {runValidators: true, new: true},
		    function (err, modifiedCountdown) {
		      	if (!!err) {
		        	return console.error(err);
					this.postMessage(message.channel,
						`There was an error updating your countdown.`,
						{as_user: name});
		      	} else if (!!modifiedCountdown) {
		      		if (successCb) {
		      			successCb(modifiedCountdown)
		      		}
		      		if (successMessage) {
						this.postMessage(message.channel,
							successMessage,
							{as_user: name});
		      		}
		      	} else {
		      		this.postMessage(message.channel,
						`Couldn't find a countdown for that event...sorry. Try asking me for "list" to see your current countdowns!`,
						{as_user: name});
		      	}
 	 	}.bind(this));
	}


	handleNewChronJob (countdown, message) {
		var _this = this;
		var rule = countdown.schedule.rule;
		var ruleIsInOldFormat = !rule.hour;

		if (ruleIsInOldFormat) {
			console.log('old format alert', countdown);
		} else {
			console.log('handling new chron job', event);
			rule = utils.getScheduleRule(rule);
			console.log('scheduling', event);

			var scheduled = nodeSchedule.scheduleJob(rule, function(){
				var event = countdown.event;
				var team = message.team;
				var reminder;
				var today = moment();
				var hours = moment(countdown.date).diff(today, 'hours');
				var rawDays = hours/24;
				var days = Math.ceil(rawDays);

				if (hours > 0 && hours < 24) {
					_this._deleteCountdown({event: event}, {team: team}, true);
					reminder = `Hooray! Today is the day for ${event}! You lucky dowgs, you. I just removed that countdown for ya. Bark!`
				} else if (rawDays < 0) {
					_this._deleteCountdown({event: event}, message, true);
					reminder =`Looks like ${event} already happened! I just went ahead and removed that countdown for ya. Arf!`
				} else {

					reminder = `And now for your scheduled reminder: ${days} ${days > 1 ? 'days' : 'day'} until ${event}!`;
				}
				_this.postMessage(message.channel, reminder, {as_user: _this.user.name});
			});
			this.chronJobs[countdown.schedule.id] = scheduled;
			console.log('done scheduling', countdown.event);

		}

	}

	_removeChronJob (settings, message) {
		var scheduleId = message.team + settings.event.split(' ').join('');
		var job = _.get(this.chronJobs, scheduleId);
		if (job) {
			job.cancel();
			delete this.chronJobs[scheduleId];
		};
	}

	_reformatChron (settings, message) {
		// Default to Monday at 10am
		// format: [second, minute, hour, day of month, month, day of week]
		var chron = {dayOfWeek: 1, hour: 10};
		var day = settings.day;
		var hour = settings.hour;
		var response, error;

		chron.hour = !!hour ? utils.handleHour(hour, chron.hour, message, this) : chron.hour;
		if (settings.schedule === 'weekly') {
			if (!!day) {
				chron.dayOfWeek = utils.handleDay(day, chron.dayOfWeek, message, this);
			}
		} else if (settings.schedule = 'daily') {
			chron.dayOfWeek = null;
		} else {
			error = 'I didn\'t quite get that. Try again, using "daily" or "weekly", or ask for help for more instructions.'
			this.postMessage(message.channel, error, {as_user: this.user.name});
			return;
		}
		this._updateChron(settings, message, chron);
	}

	_updateChron (settings, message, rule) {
		var _this = this;
		if (!settings.event){
			this.postMessage(
				message.channel,
				`Sorry, you need to specify which event you'd like to update! Ask me for the \`list\` if you don't remember the name`,
				{as_user: this.user.name
			});
		}
		var scheduleId = message.team + settings.event.split(' ').join('');
		var team = message.team || settings.teamId;

		this._updateCountdown(
			{teamId: team, event: settings.event},
			{schedule: {rule: rule, channel: message.channel, id: scheduleId}},
			message,
			`I've updated your ${settings.schedule} scheduled reminder!`,
			function (updatedCountdown) {
				_this._removeChronJob(settings, message);
				_this.handleNewChronJob(updatedCountdown, message);
			});
	}

	_cancelChron (settings, message) {
		this._removeChronJob(settings, message);

		this._updateCountdown(
			{teamId: message.team, event: settings.event},
			{schedule: {}},
			message,
			'I\'ve canceled your scheduled updates.');
	}
}

module.exports = CountdownBot;
