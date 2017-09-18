'use strict';

const SlackWrapper = require('./slack-wrapper'),
	 	 Countdown = require('./models/countdown'),
	  		   Bot = require('./models/bot'),
	 		 utils = require('./utils'),
   	 	   presets = require('../data/presets'),
  messageGenerator = require('./messageGenerator'),
	 			 _ = require('lodash'),
 			moment = require('moment'),
 	  nodeSchedule = require('node-schedule');

class CountdownBot extends SlackWrapper {
	hello (channel) {
		this._sayHello({channel: channel});

	}

	onMessage (message) {
		console.log(message)
		let settings;
	    if (utils.isValidMessage(message)) {
	    	console.log('message received', message);
        	var type = utils.extractType(message);
        	switch (type) {
        		case 'help':
        			utils.extractSettings(message, 'idOnly').then(settings => {
	        			this._sendHelpResponse(message, settings);
        			})
        			break;
        		case 'start':
        			utils.extractSettings(message, 'date').then(settings => {
	        			if (settings.dumb) {
	        				this._noDumbPlease(message);
	        			} else {
	        				this._startCountdown(settings, message);
	        			}
        			})
        			break;
        		case 'reset':
        			utils.extractSettings(message, 'date').then(settings => {
        				this._resetCountdown(settings, message);
        			})
        			break;
        		case 'schedule':
        			utils.extractSettings(message, 'schedule').then(settings => {
        				this._reformatChron(settings, message);
        			})
        			break;
        		case 'cancel':
        			utils.extractSettings(message, 'event').then(settings => {
        				this._cancelChron(settings, message);
        			})
        			break;
        		case 'delete':
        			utils.extractSettings(message, 'event').then(settings => {
        				this._deleteCountdown(settings, message);
        			})
        			break;
        		case 'list':
        			utils.extractSettings(message, 'idOnly').then(settings => {
        				this._listTeamEvents(message, settings);
        			})
        			break;
        		case 'countdown':
        			utils.extractSettings(message, 'countdown').then(settings => {
        				this._replyToChannel(message, settings);
        			})
        			break;
        		case 'hello':
        			utils.extractSettings(message, 'idOnly').then(settings => {
        				this._sayHello(message, settings);
        			})
        			break;
        		default:
        			if (message.text.length > `<@${message.relax_bot_uid}>`.length) {
        				utils.extractSettings(message, 'idOnly').then(settings => {
        					message.text = _.trim(message.text.slice(`<@${message.relax_bot_uid}>`.length));
	    					this._randomRepliesToChannel(message, settings);
        				})
        			}
        	}
    	}
	}

	_noDumbPlease (message, settings) {
		this.postMessage(message.channel_uid, presets.nodumb, settings);
	}

	_sayHello (message, settings) {
		console.log(message);
		this.postMessage(message.channel_uid, presets.sayHello, settings);
	}

	_listTeamEvents (message, settings) {
		console.log('finding countdowns for settings:', settings)
		Countdown.find({teamId: settings.teamId}).then(function (countdowns) {
			var events = _.map(countdowns, function (countdown, index) {
				return `${index + 1}: ${countdown.event} _on_ ${moment(countdown.date).calendar()}`;
			});

			var reply = events.length > 0 ?
				`Your events:\n ${events.join('\n')}` :
				`You haven't listed any events yet! Ask for 'help' if you're having a ...ruff time!`;

			this.postMessage(message.channel_uid, reply, settings);
		}.bind(this));
	}

	_sendHelpResponse (message, settings) {
		var helpMessage = `Happy to help! ${presets.help}`;
		this.postMessage(message.channel_uid, helpMessage, settings);
	}

	isSillyType(type, message) {
		return type.indexOf(_.trim(message.text.toLowerCase(), '!,.?')) >= 0;
	}

	_randomRepliesToChannel(message, settings) {
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
			this.postMessage(message.channel_uid, utils.pickRandom(dogSounds) + '!', settings);
		} else if (this.isSillyType(dogCommands, message)) {
			this.postMessage(message.channel_uid, 
				`Dangit, I never learned how to ${message.text}. 
				I only know how to count, read, write, and bark, 
				embarrassingly enough.`, 
				settings);
		} else {
			this.postMessage(message.channel_uid,
				utils.pickRandom(confused),
				settings);
		}
	}

	_replyToChannel (message, settings) {
		console.log('settings', settings)
	    this._generateResponse(message, settings).then(function(response) {
	    	if (!!response) {
    			this.postMessage(message.channel_uid, response, settings);
	    	}
	    }.bind(this));

	}

	_generateResponse (message, settings) {
		return Countdown.findOne({teamId: settings.teamId, event: settings.countdown}).then(function(countdown) {
			if (!countdown) {
    			this.postMessage(message.channel_uid,
    				`Oh no! No countdown found for an 
    				event called "${settings.countdown}". 
    				Try asking me for "list" to see your currently 
    				active countdowns.`,
    				settings);
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
			this.postMessage(message.channel_uid, err);
			return;
		}

		Countdown.findOne({teamId: settings.teamId, event: newSettings.event})
			.then(function(countdown) {
				if (!!countdown) {
					this.postMessage(message.channel_uid,
						`There's already a countdown for ${countdown.event}!`);
				} else {
					this._saveCountdown(newSettings, message);
				}
			}.bind(this));
	}

	_resetCountdown(newSettings, message) {
		if (!utils.isValidCountdown(newSettings)) {
			return;
		}

		_.assign(newSettings, {schedule: {rule: {hour: 10, dayOfWeek: 1}}});
		this._updateCountdown(
			newSettings,
			{teamId: newSettings.teamId, event: newSettings.event},
			newSettings,
			message,
			'I\'ve updated your event and started a new weekly countdown!'
		);
	}

	_saveCountdown(newSettings, message) {
		var scheduleId = settings.teamId + newSettings.event.split(' ').join('');
		var newCountdown = new Countdown({
			event: newSettings.event,
			botId: this.user.id,
			destination: newSettings.destination,
			date: newSettings.date,
			teamId: newSettings.teamId,
			channels: [	message.channel_uid ],
			botAccessToken: newSettings.botAccessToken,
			schedule: {
				id: scheduleId,
				rule: {hour: 10, dayOfWeek: 1},
				channel: message.channel_uid
			}
		});

		newCountdown.save().then(function (countdown) {
			this.handleNewChronJob(newSettings, countdown, message);
			this.postMessage(message.channel_uid,
				`I've created your new countdown for ${countdown.event}!`);
		}.bind(this)).catch(function (err) {
			console.error(err);
		});
	}

	_deleteCountdown (settings, message, skipMessage) {
		Countdown.findOneAndRemove(
	    {teamId: settings.teamId, event: settings.event},
	    function (err, modifiedCountdown) {
	      	if (!!err) {
	        	console.error(err);
				this.postMessage(message.channel_uid,
					`There was an error removing your countdown. Did you have the right event name?`);
	      	} else if (!!modifiedCountdown) {
				this._removeChronJob(settings, message);
				if (!skipMessage) {
					this.postMessage(message.channel_uid,
						`I've successfully removed ${settings.event} from your current countdowns.`)
				}
	      	}
 	 	}.bind(this));
	}

	_updateCountdown (settings, query, updatedCountdown, message, successMessage = 'I\'ve updated your countdown!', successCb) {
		Countdown.findOneAndUpdate(
		    query,
		    updatedCountdown,
		    {runValidators: true, new: true},
		    function (err, modifiedCountdown) {
		      	if (!!err) {
		        	return console.error(err);
					this.postMessage(message.channel_uid,
						`There was an error updating your countdown.`,
						settings);
		      	} else if (!!modifiedCountdown) {
		      		if (successCb) {
		      			successCb(modifiedCountdown)
		      		}
		      		if (successMessage) {
						this.postMessage(message.channel_uid,
							successMessage,
							settings);
		      		}
		      	} else {
		      		this.postMessage(message.channel_uid,
						`Couldn't find a countdown for that event...sorry. Try asking me for "list" to see your current countdowns!`,
						settings);
		      	}
 	 	}.bind(this));
	}


	handleNewChronJob (settings, countdown, message) {
		var _this = this;
		var rule = countdown.schedule.rule;
		var ruleIsInOldFormat = !rule.hour;

		if (ruleIsInOldFormat) {
			console.log('old format alert', countdown);
		} else {
			console.log('handling new chron job', countdown.event, message.team_uid);
			rule = utils.getScheduleRule(rule);
			console.log('scheduling', countdown.event);

			var scheduled = nodeSchedule.scheduleJob(rule, function(){
				var event = countdown.event;
				var team = message.team_uid;
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
				_this.postMessage(message.channel_uid, reminder, settings);
			});
			this.chronJobs[countdown.schedule.id] = scheduled;
			console.log('done scheduling', countdown.event);

		}

	}

	_removeChronJob (settings, message) {
		var scheduleId = message.team_uid + settings.event.split(' ').join('');
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
			this.postMessage(message.channel_uid, err);
			return;
		}
		this._updateChron(settings, message, chron);
	}

	_updateChron (settings, message, rule) {
		var _this = this;
		if (!settings.event) {
			this.postMessage(
				message.channel_uid,
				`Sorry, you need to specify which event 
				you'd like to update! Ask me for the \`list\` 
				if you don't remember the name`)
		}
		var scheduleId = message.team_uid + settings.event.split(' ').join('');
		var team = message.team_uid || settings.teamId;

		this._updateCountdown(
			settings,
			{teamId: team, event: settings.event},
			{schedule: {rule: rule, channel: message.channel_uid, id: scheduleId}},
			message,
			`I've updated your ${settings.schedule} scheduled reminder!`,
			function (updatedCountdown) {
				_this._removeChronJob(settings, message);
				_this.handleNewChronJob(settings, updatedCountdown, message);
			});
	}

	_cancelChron (settings, message) {
		this._removeChronJob(settings, message);

		this._updateCountdown(
			settings,
			{teamId: settings.teamId, event: settings.event},
			{schedule: {}},
			message,
			'I\'ve canceled your scheduled updates.');
	}
}

module.exports = CountdownBot;
