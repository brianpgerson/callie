'use strict';
var util = require('util');
var Bot = require('slackbots');
var _ = require('lodash');
var presets = require('../data/presets');
var moment = require('moment');
var schedule = require('node-schedule');

class CountdownBot extends Bot {

 	constructor(settings) {
 		super(settings);
 		this.event = settings.event;
 		this.date = moment(settings.date);
 		this.destination = settings.destination;
 		this.chron = settings.chron;

 		this.openers = presets.openers;
		this.enders = presets.enders;
	    this.firstRun = true;
	    this.user = null;
	}

	/**
	 * Run the bot
	 * @public
	 */
	run () {
	    this.on('start', this._onStart);
	    this.on('message', this._onMessage);
	    this._startScheduler();
	}

	_startScheduler () {
		schedule.scheduleJob(this.chron, function() {
			var message = `Weekly update: ${this._generateResponse()}`;
			this._allChannels(message);
		}.bind(this));
	}

	_allChannels (message) {
	  	_.each(this.channels, function(channel) {
	  		this.postMessage(channel, message, {as_user: this.user.name});
	  	}.bind(this));
	}

	_reset(newSettings, message) {
		var error;
		if (!newSettings.event && !newSettings.destination) {
			error = 'You have to set either an event, a destination, or both!';
		} else if (!newSettings.date) {
			error = 'You have to set either an event, a destination, or both!';
		}
		if (!!error) {
			this.postMessage(message.channel, error, {as_user: this.user.name});
		} else {
			this.event = newSettings.event;
			this.destination = newSettings.destination === 'cities' ? presets.cities : newSettings.destination;
			this.date = moment(newSettings.date);
			this.postMessage(message.channel, 'I\'ve updated your countdown!', {as_user: this.user.name});
		}
	}


	_onStart () {
	    this._loadBotUser();
	    this._firstRunCheck();
	}

	_loadBotUser () {
		var myName = this.self.name;
	    this.user = _.filter(this.users, function (user) {
	        return user.name === myName;
	    })[0];
	}

	_firstRunCheck () {
		if (this.firstRun) {
			this.firstRun = false;
	    	this._welcomeMessage();
		}
	}

	_welcomeMessage () {
	    this._allChannels(presets.welcomeMessage);
	}

	_sendHelpResponse (message) {
		var helpMessage = `Happy to help! ${presets.welcomeMessage}`;

		this.postMessage(
			message.channel,
			helpMessage,
			{as_user: this.user.name}
		);
	}

	_onMessage (message) {

	    if (this._isChatMessage(message) &&
	        this._isChannelConversation(message) &&
	        !this._isFromTheCount(message) &&
	        this._isMentioningTheCount(message)) {
	        	var type = this._extractType(message);
	        	switch (type) {
	        		case 'help':
	        			this._sendHelpResponse(message);
	        			break;
	        		case 'reset':
	        			var settings = this._extractSettings(message, 'date');
	        			this._reset(settings, message);
	        			break;
	        		case 'schedule':
	        			var settings = this._extractSettings(message, 'schedule');
	        			this._updateChron(settings, message);
	        			break;
	        		default:
	        			this._replyToChannel(message);
	        	}
	    	}
	}

	_updateChron (settings, message) {
		// Default to Monday at 10am
		// format: [second, minute, hour, day of month, month, day of week]
		var chron = ['*', '*', 10, '*', '*', 1];

		var day = settings.day;
		var hour = settings.hour;
		var response, error;

		chron[2] = hour ? this._handleHour(hour, chron[2]) : chron[2];

		if (settings.schedule === 'weekly' && !!day) {
			chron[5] = this._handleDay(day, chron[5]);
			this.chron = chron.join(' ');
			response = `Updated weekly scheduled reminder to ${day ? _.upperFirst(day) : 'Monday'} at ${chron[2]}`;
		} else if (settings.schedule = 'daily') {
			chron[5] = '*';
			this.chron = chron.join(' ');
			response = `Updated to daily scheduled reminder at ${chron[2]}`;
		} else {
			error = 'I didn\'t quite get that. Try again, using "daily" or "weekly", or ask for help for more instructions.'
			this.postMessage(message.channel, error, {as_user: this.user.name});
			return;
		}

		this.postMessage(message.channel, response, {as_user: this.user.name});
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
			error = 'If you\'d like to pick a day of the week, please set like `day: monday`, for example';
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
		var reset = new RegExp(/reset/);
		var schedule = new RegExp(/schedule/);
		if (messageText.match(help)) {
			return 'help';
		} else if (messageText.match(reset)) {
			return 'reset';
		} else if (messageText.match(schedule)) {
			return 'schedule';
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

		return settings;
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

	_replyToChannel (originalMessage) {
	    var message = this._generateResponse()

    	this.postMessage(originalMessage.channel, message, {as_user: this.user.name});
	}

	_generateResponse () {
		var builtMessage = `${this._pickRandom(this.openers)} ${this.date.diff(new Date(), 'days')} days`;
		var event = this.event;
		var destination = this.destination;
		destination = Array.isArray(destination) ? this._pickRandom(destination) : destination;

		if (!!destination && !!event) {
			builtMessage += ` ${this._pickRandom(this.enders)} trip to ${destination} for ${event}`;
		} else if (!!event) {
			builtMessage += ` until ${event}`;
		} else if (!!destination) {
			builtMessage += ` ${this._pickRandom(this.enders)} trip to ${destination}`;
		}

		return builtMessage;
	}

	_pickRandom (options) {
		return options[Math.floor(Math.random() * options.length)];
	}

}

module.exports = CountdownBot;
