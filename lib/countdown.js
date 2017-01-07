'use strict';
var util = require('util');
var Bot = require('slackbots');
var _ = require('lodash');
var moment = require('moment');

class CountdownBot extends Bot {

 	constructor(settings) {
 		super(settings);
 		this.event = settings.event;
 		this.channels = [];
 		this.date = moment(settings.date);
 		this.destination = settings.destination;
 		this.openers = [
			'Glad you asked! There are',
			'Let me check the schedule. Ah, yes:',
			'How exciting. There are only',
			'Well if you must know, there remain',
			'As far as I know, there are precisely'
		];

		this.enders = [
		    'until your incredibly exciting',
		    'until your mind-bogglingly fun',
		    'until your super anticipated',
		    'until your epic and excellent'
		];
	    this.firstRun = false;
	    this.user = null;
	}

	/**
	 * Run the bot
	 * @public
	 */
	run () {
	    this.on('start', this._onStart);
	    this.on('message', this._onMessage);
	}

	_reset(newSettings, message) {
		console.log(newSettings)
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
			this.destination = newSettings.destination;
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
	    this.user = this.users.filter(function (user) {
	        return user.name === myName;
	    })[0];
	}

	_firstRunCheck () {
		if (!this.firstRun) {
			this.firstRun = true;
	    	this._welcomeMessage();
		}
	}

	_welcomeMessage () {
		// commented this out cause I don't like it but maybe you want it.
	    // this.postMessageToChannel(this.channels[0].name, 'Hi guys, The Count here.' + '\n I\'m a really impressive and super sophisticated piece of software that counts down to...well, anything you want, really! Invoke me by typing "the count" or simply mentioning my name',
	        // {as_user: true});
	}

	_sendHelpResponse (message) {
		var helpMessage =
`Happy to help! I'm a friendly countdown bot, and I'm very simple to use.
Simply call my name (\`@thecount\`) and I'll tell you how many days are left until an event or trip to a destination of your choosing.
Each countdown just needs either a destination, an event name, or both, plus the date.

To reset, simply say:

\`@thecount reset date: <the date, formatted YYYY-MM-DD>, destination: <your destination>, event: <your event name>\`

I'll let you know if you got it right!
To see this message again, simply say "@thecount help".

You can find more information (or contribute to The Count) at www.github.com/brianpgerson/the-count

See ya!`;

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
	        			var settings = this._extractUpdateSettings(message);
	        			this._reset(settings, message);
	        			break;
	        		default:
	        			this._replyToChannel(message);
	        	}
	    	}
	}


	_extractType (message) {
		var messageText = message.text.toLowerCase();
		var help = new RegExp(/help/);
		var reset = new RegExp(/reset/);
		if (messageText.match(help)) {
			return 'help';
		} else if (messageText.match(reset)) {
			return 'reset';
		}
	}

	_extractUpdateSettings (message) {
		var settings = {};
		var originalMessage = message.text;

		var text = message.text.toLowerCase();
		var cleanStringSettings = originalMessage.slice(text.indexOf('date')).split(',');

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

	    // save for weekly count
	    if (this.channels.indexOf(originalMessage.channel) < 0) {
	    	this.channels.push(originalMessage.channel);
	    }

    	this.postMessage(originalMessage.channel, message, {as_user: this.user.name});
	}

	_generateResponse () {
		var builtMessage = `${this._pickRandom(this.openers)} ${this.date.diff(new Date(), 'days')} days`;
		var destination = this.destination;
		var event = this.event;
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
