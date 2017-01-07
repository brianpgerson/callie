'use strict';
var util = require('util');
var Bot = require('slackbots');
var cities = require('../data/cities');
var moment = require('moment');

class CountdownBot extends Bot {

 	constructor(settings) {
 		super(settings);
 		this.eventName = 'Mystery Trip'
 		this.eventDate = moment(settings.dateString);
 		this.openers = [
			'Glad you asked! There are ',
			'Let me check the schedule. Ah, yes: ',
			'How exciting. There are only ',
			'Well if you must know, there remain ',
			'As far as I know, there are precisely '
		],

		this.enders = [
		    ' days remaining until you all make the journey to ',
		    ' days left until the mystery trip to ',
		    ' days until you find yourself on a flight to ',
		    ' days until your epic outing to '
		]
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

	_onMessage (message) {

	    if (this._isChatMessage(message) &&
	        this._isChannelConversation(message) &&
	        !this._isFromTheCount(message) &&
	        this._isMentioningTheCount(message)
	    ) {
	        this._replyToChannel(message);
	    }
	}

	_isChatMessage (message) {
		var itsachat = message.type === 'message' && Boolean(message.text);
	    return itsachat;
	}

	_isChannelConversation (message) {
	    return typeof message.channel === 'string' &&
	        message.channel[0] === 'C' || message.channel[0] === 'G';
	}

	_isFromTheCount (message) {
	    return message.user === this.user.id;
	}

	_isMentioningTheCount (message) {
		var mentionedName = message.text.toLowerCase().split(' ').join('');
		var checkAgainst = new RegExp(this.name.toLowerCase().split(' ').join(''));
		var userId = new RegExp(this.user.id.toLowerCase());
		return mentionedName.match(checkAgainst) || mentionedName.match(userId);
	}

	_replyToChannel (originalMessage) {
	    var channel = this._getChannelById(originalMessage.channel);
	    var message = this._generateResponse()
    	this.postMessage(originalMessage.channel, message, {as_user: this.user.name});
	}

	_getChannelById (channelId) {
	    return this.channels.filter(function (item) {
	        return item.id === channelId;
	    })[0];
	}

	_generateResponse () {
		var destination = cities[Math.floor(Math.random() * cities.length)];
		return this._pickRandom(this.openers) + this.eventDate + this._pickRandom(this.enders) + destination + ' for the ' + this.eventName;
	}

	_pickRandom (options) {
		return options[Math.floor(Math.random() * options.length)];
	}

}
module.exports = CountdownBot;
