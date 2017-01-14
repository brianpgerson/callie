const _ = require('lodash');

exports.extractSettings = function (message, type) {
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

exports.isChatMessage = function (message) {
	return message.type === 'message' && Boolean(message.text);
}

exports.isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C' || message.channel[0] === 'G' || message.channel[0] === 'D';
}

exports.isFromTheCount = function (message, me) {
    return message.user === me;
}

exports.isMentioningTheCount = function (message, me) {
	var messageText = message.text.toLowerCase();
	var userId = new RegExp(me.toLowerCase());
	return messageText.match(userId);
}

exports.pickRandom = function (options) {
	return options[Math.floor(Math.random() * options.length)];
}

exports.isValidCountdown = function (newSettings, message) {
	if (!newSettings.event || !newSettings.date) {
		return false;
	}
	return true;
}

exports.isValidMessage = function (message, me) {
	return this.isChatMessage(message) &&
        this.isChannelConversation(message) &&
        !this.isFromTheCount(message, me) &&
        this.isMentioningTheCount(message, me)
}

exports.extractType = function (message) {
	var messageText = message.text.toLowerCase();
	var help = new RegExp(/help/);
	var start = new RegExp(/start/);
	var reset = new RegExp(/reset/);
	var schedule = new RegExp(/schedule/);
	var cancel = new RegExp(/cancel/);
	var list = new RegExp(/list/);
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
	}else if (messageText.match(list)) {
		return 'list';
	}
}

exports.extractSettings = function (message, type) {
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

exports.handleHour = function (hour, original, theCount) {
	hour = parseInt(hour, 10);
	if (!_.isFinite(hour) || !_.inRange(hour, 24)) {
		error = 'Hour setting is optional and set in military time, so 3pm would be `hour: 15`.';
		theCount.postMessage(message.channel, error, {as_user: theCount.user.name});
		return original;
	} else if (_.inRange(hour, 24)) {
		return hour;
	}
}

exports.handleDay = function (day, original, theCount) {
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
		theCount.postMessage(message.channel, error, {as_user: theCount.user.name});
		return original;
	} else if (!!daysOfWeek[day]) {
		return daysOfWeek[day];
	}
}

