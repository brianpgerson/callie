'use strict';
var util = require('util');
var Bot = require('slackbots');
var Countdown = require('./models/countdown');
var _ = require('lodash');
var presets = require('../data/presets');
var moment = require('moment');
var nodeSchedule = require('node-schedule');

class CountdownBot extends Bot {

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

	_onStart () {
	    this.user = _.filter(this.users, function (user) {
	        return user.name === this.self.name;;
	    }.bind(this))[0];
	}

	_sendHelpResponse (message) {
		var helpMessage = `Happy to help! ${presets.welcomeMessage}`;
		this.postMessage(message.channel, helpMessage, {as_user: this.user.name});
	}

	_onMessage (message) {
	    if (this._isValidMessage(message)) {
        	var type = this._extractType(message);
        	switch (type) {
        		case 'help':
        			this._sendHelpResponse(message);
        			break;
        		case 'start':
        			var settings = this._extractSettings(message, 'date');
        			this._startCountdown(settings, message);
        			break;
        		case 'reset':
        			var settings = this._extractSettings(message, 'date');
        			this._resetCountdown(settings, message);
        			break;
        		case 'schedule':
        			var settings = this._extractSettings(message, 'schedule');
        			this._reformatChron(settings, message);
        			break;
        		case 'cancel':
        			var settings = this._extractSettings(message, 'event');
        			this._cancelChron(settings, message);
        			break;
        		case 'delete':
        			var settings = this._extractSettings(message, 'event');
        			this._deleteCountdown(settings, message);
        		default:
        			if (message.text.length > `<@${this.user.id}>`.length) {
        				message.text = _.trim(message.text.slice(`<@${this.user.id}>`.length));
	    				this._replyToChannel(message);
        			}
        	}
    	}
	}

	_replyToChannel (originalMessage) {
	    this._generateResponse(originalMessage).then(function(response) {
	    	if (!!response) {
    			this.postMessage(originalMessage.channel, response, {as_user: this.user.name});
	    	}
	    }.bind(this));

	}

	_generateResponse (message) {
		return Countdown.findOne({teamId: message.team, event: _.trim(message.text)}).then(function(countdown) {
			if (!countdown) {
    			this.postMessage(message.channel,
    				`No countdown found for event: ${message.text}`,
    				{as_user: this.user.name});
    			return;
			}

			var generatedMessage = `${this._pickRandom(this.openers)} ${moment(countdown.date).diff(new Date(), 'days')} days`;
			var event = countdown.event;
			var destination = countdown.destination;
			destination = countdown.destination === 'cities' ? this._pickRandom(presets.cities) : countdown.destination;

			return this._buildGeneratedMessage(generatedMessage, event, destination);
		}.bind(this));
	}

	_buildGeneratedMessage(generatedMessage, event, destination) {
		if (!!destination && !!event) {
			generatedMessage += ` ${this._pickRandom(this.enders)} trip to ${destination} for ${event}`;
		} else if (!!event) {
			generatedMessage += ` until ${event}`;
		} else if (!!destination) {
			generatedMessage += ` ${this._pickRandom(this.enders)} trip to ${destination}`;
		}

		return generatedMessage;
	}

	_startCountdown(newSettings, message) {
		if (!this._isValidCountdown(newSettings, message)) {
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
		if (!this._isValidCountdown(newSettings, message)) {
			return;
		}

		function restartChron() {
			this._updateChron(settings, message, ['*', '*', 10, '*', '*', 1]);
		};

		_updateCountdown(
			{teamId: message.team, event: newSettings.event},
			newSettings,
			message,
			'I\'ve updated your event and started a new weekly countdown!',
			restartChron
		);
	}

	_saveCountdown(newSettings, message) {
		var scheduleId = message.team + newSettings.event.split(' ').join('');
		var newCountdown = new Countdown({
			event: newSettings.event,
			destination: newSettings.destination,
			date: newSettings.date,
			teamId: message.team,
			schedule: {
				id: scheduleId,
				rule: '* * 10 * * 1',
				active: true
			}
		});

		newCountdown.save().then(function (countdown) {
			this._handleNewChronJob(countdown, message);
			this.postMessage(message.channel,
				`I've created your new countdown for ${countdown.event}!`,
				{as_user: this.user.name});
		}.bind(this)).catch(function (err) {
			console.log(err);
		});
	}

	_deleteCountdown (settings, message) {
		Countdown.findOneAndRemove(
	    {team: message.team, event: settings.event},
	    function (err, modifiedCountdown) {
	      	if (!!err) {
	        	return console.error(err);
				this.postMessage(message.channel,
					`There was an error deleting your countdown. Did you have the right event name?`,
					{as_user: this.user.name});
	      	} else if (!!modifiedCountdown) {
				this._removeChronJob(settings, message);
				this.postMessage(message.channel,
					`I've successfully removed ${event} from your current countdowns.`,
					{as_user: this.user.name})
	      	}
 	 	}.bind(this));
	}

	_updateCountdown (updatedVersion, query, message,
						successMessage = 'I\'ve updated your countdown!', successCb) {
		Countdown.findOneAndUpdate(
	    query,
	    updatedVersion,
	    {runValidators: true},
	    function (err, modifiedCountdown) {
	      	if (!!err) {
	        	return console.error(err);
				this.postMessage(message.channel,
					`There was an error updating your countdown.`,
					{as_user: this.user.name});
	      	} else if (!!modifiedCountdown) {
	      		successCb()
				this.postMessage(message.channel,
					successMessage,
					{as_user: this.user.name})
	      	}
 	 	}.bind(this));
	}

	_handleNewChronJob (countdown, originalMessage) {
		var self = this;
		var scheduled = nodeSchedule.scheduleJob('* * * * *', function(){
			var message = `Weekly update: ${self._generateResponse(originalMessage)}`;
			self.postMessage(message.channel, message, {as_user: self.user.name});
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

		chron[2] = hour ? this._handleHour(hour, chron[2]) : chron[2];

		if (settings.schedule === 'weekly') {
			if (!!day) {
				chron[5] = this._handleDay(day, chron[5]);
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
			{schedule: {rule: rule, active: true}},
			{teamId: message.team, event: settings.event},
			message);
	}

	_cancelChron (settings, message) {
		this._removeChronJob(settings, message);

		this._updateCountdown(
			{schedule: {active: false}},
			{teamId: message.team, event: settings.event},
			message,
			'I\'ve canceled your scheduled updates.');
	}

	_handleDay (day, original) {
		var daysOfWeek = {
			monday: 1,
			tuesday: 2,
			wednesday: 3,
			thursday: 4,
			friday: 5,
			saturday: 6,
			sunday: 7
		};

		if (!daysOfWeek[day]) {
			error = 'If you\'d like to pick a day of the week, please set it like `day: monday`, for example';
			this.postMessage(message.channel, error, {as_user: this.user.name});
			return original;
		} else if (!!daysOfWeek[day]) {
			return daysOfWeek[day];
		}
	}

	_handleHour (hour, original) {
		hour = parseInt(hour, 10);
		if (!_.isFinite(hour) || !_.inRange(hour, 24)) {
			error = 'Hour setting is optional and set in military time, so 3pm would be `hour: 15`.';
			this.postMessage(message.channel, error, {as_user: this.user.name});
			return original;
		} else if (_.inRange(hour, 24)) {
			return hour;
		}
	}

	_extractType (message) {
		var messageText = message.text.toLowerCase();
		var help = new RegExp(/help/);
		var start = new RegExp(/start/);
		var reset = new RegExp(/reset/);
		var schedule = new RegExp(/schedule/);
		var cancel = new RegExp(/cancel/);
		if (messageText.match(help)) {
			return 'help';
		} else if (messageText.match(reset)) {
			return 'reset';
		} else if (messageText.match(schedule)) {
			return 'schedule';
		} else if (messageText.match(start)) {
			return 'start';
		} else if (messageText.match(cancel)) {
			return 'cancel';
		}
	}

	_extractSettings (message, type) {
		var settings = {};
		var originalMessage = message.text;

		var text = message.text.toLowerCase();
		var cleanStringSettings = originalMessage.slice(text.indexOf(type)).split(',');

		_.each(cleanStringSettings, function (setting) {
			setting = _.trim(setting);
			var pair = _.map(setting.split(':'), _.trim)

			settings[pair[0].toLowerCase()] = pair[1];
		});

		return _.pick(settings, ['date', 'event', 'destination', 'schedule', 'day', 'hour']);
	}

	_isChatMessage (message) {
		return message.type === 'message' && Boolean(message.text);
	}

	_isChannelConversation (message) {
	    return typeof message.channel === 'string' &&
	        message.channel[0] === 'C' || message.channel[0] === 'G';
	}

	_isFromTheCount (message) {
	    return message.user === this.user.id;
	}

	_isMentioningTheCount (message) {
		var messageText = message.text.toLowerCase();
		var userId = new RegExp(this.user.id.toLowerCase());
		return messageText.match(userId);
	}

	_pickRandom (options) {
		return options[Math.floor(Math.random() * options.length)];
	}

	_isValidCountdown (newSettings, message) {
		if (!newSettings.event || !newSettings.date) {
			var error = 'You must set both an event and a date.';
			this.postMessage(message.channel, error, {as_user: this.user.name});
			return false;
		}
		return true;
	}

	_isValidMessage (message) {
		return this._isChatMessage(message) &&
	        this._isChannelConversation(message) &&
	        !this._isFromTheCount(message) &&
	        this._isMentioningTheCount(message)
	}
}

module.exports = CountdownBot;
