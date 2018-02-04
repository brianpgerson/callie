const _ = require('lodash');
const moment = require('moment');
const nodeSchedule = require('node-schedule');
const Bot = require('./models/bot')

exports.isChatMessage = function (message) {
	return message.type === 'message_new' && !_.isUndefined(message.text);
}

exports.isChannelConversation = function (message) {
    return typeof message.channel_uid === 'string' &&
        message.channel_uid[0] === 'C' || 
        message.channel_uid[0] === 'G' || 
        message.channel_uid[0] === 'D';
}

exports.notFromCallie = function (message) {
    return message.user_uid !== message.relax_bot_uid;
}

exports.isMentioningCallie = function (message) {
	var messageText = message.text.toLowerCase();
	var userId = new RegExp(message.relax_bot_uid.toLowerCase());
	return messageText.match(userId);
}

exports.pickRandom = function (options) {
	return options[Math.floor(Math.random() * options.length)];
}

exports.eventPassed = function (countdown) {
	var eventDate = moment(countdown.date);
	var today = moment();
	var hours = eventDate.diff(today, 'hours');
	return hours < 0;
}

exports.isValidCountdown = function (newSettings) {
	if (!newSettings.event || !newSettings.date) {
		return false;
	}
	return true;
}

exports.isValidMessage = function (message) {
	const isChatMessage = this.isChatMessage(message),
		  isChannelConversation = this.isChannelConversation(message),
		  notFromCallie = this.notFromCallie(message),
		  isMentioningCallie = this.isMentioningCallie(message);
	
	return isChatMessage && isChannelConversation && notFromCallie && isMentioningCallie;
}

exports.extractType = function (message) {
	var messageText = message.text.toLowerCase().split(' ')[1];
	if (!messageText) {
		return;
	}
	var help = new RegExp(/help/);
	var start = new RegExp(/start/);
	var reset = new RegExp(/reset/);
	var schedule = new RegExp(/\bschedule/);
	var cancel = new RegExp(/cancel/);
	var list = new RegExp(/list/);
	var hello = new RegExp(/hello/);
	var remove = new RegExp(/delete/);
	var countdown = new RegExp(/countdown/);
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
	} else if (messageText.match(list)) {
		return 'list';
	} else if (messageText.match(countdown)) {
		return 'countdown';
	} else if (messageText.match(remove)) {
		return 'delete';
	} else if (isHello(messageText)) {
		return 'hello';
	}
}

isHello = function (string) {
	var hellos = ['hello', 'hi', 'howdy', 'welcome', 'hey'];
	return hellos.indexOf(_.trim(string, '!,.?')) >= 0;
}

exports.extractSettings = function (message, type) {
	return Bot.findOne({teamId: message.team_uid}).then(bot => {
		if (!bot) {
			console.log(`ERROR: no bot found somehow for a message from team ${message.team_uid}`);
			return;
		}

		var settings = {
			teamId: message.team_uid, 
			token: bot.botAccessToken
		};

		if (type === 'idOnly') {
			return settings;
		} 

		return parseMessageForMoreSettings(message, type, settings);
	});
}

parseMessageForMoreSettings = function(message, type, settings) {
	var originalMessage = message.text;
	var text = message.text.toLowerCase();
	var cleanStringSettings = originalMessage.slice(text.indexOf(type)).split(',');

	_.each(cleanStringSettings, function (setting) {
		setting = _.trim(setting);
		var pair = _.map(setting.split(':'), _.trim)
		if (pair.length > 2) {
			pair = [pair.shift(), pair.join(':')];

		}

		var string = sanitize(pair[1]);

		if (isDumb(string)) {
			settings.dumb = true;
		}

		settings[pair[0].toLowerCase()] = string
	});

	return _.pick(settings, ['date', 'token', 'teamId', 'event', 'destination', 'schedule', 'day', 'hour', 'countdown', 'dumb']);
}

sanitize = function (string) {
	return removeLinks(string);
}

removeLinks = function (string) {
	return string.match(/<http/) ? string.slice(8, string.length-1).split('|')[1] : string;
}

isDumb = function (string) {
	var iAmDumb = new RegExp(/&lt;/);
	return string.match(iAmDumb);
}

exports.handleHour = function (hour, original, message, settings, callie) {
	hour = parseInt(hour, 10);
	if (!_.isFinite(hour) || !_.inRange(hour, 24)) {
		error = 'Hour setting is optional and set in military time, so 3pm would be `hour: 15`.';
		callie.postMessage(message.channel_uid, error, settings.token);
		return original;
	} else if (_.inRange(hour, 24)) {
		return hour;
	}
}

exports.getScheduleRule = function(savedRule) {
	var rule = new nodeSchedule.RecurrenceRule();
	rule.hour = savedRule.hour;
	rule.minute = 0;

	if (savedRule.dayOfWeek) {
		rule.dayOfWeek = savedRule.dayOfWeek;
	}

	return rule;
}

exports.handleDay = function (day, original, message, callie, settings) {
	var daysOfWeek = {
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6,
		sunday: 0
	};

	if (!daysOfWeek[day]) {
		error = 'If you\'d like to pick a day of the week, please set it like `day: monday`, for example';
		callie.postMessage(message.channel, error, settings);
		return original;
	} else if (!!daysOfWeek[day]) {
		return daysOfWeek[day];
	}
}

