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

	initiateScheduler() {
		var rule = new nodeSchedule.RecurrenceRule();
		rule.second = 0;
		rule.minute = 0;

		var scheduler = nodeSchedule.scheduleJob(rule, () => {
			var date = new Date();
			var hours = date.getHours();
			var day = date.getDay();
			var query = {
				"$or": [
	         		{ 'schedule.rule.hour': hours, 'schedule.rule.dayOfWeek': null },
	         		{ 'schedule.rule.hour': hours, 'schedule.rule.dayOfWeek': day }
	      		]
	      	};

	      	console.log('finding stuff')

			Countdown.find(query).then(countdowns => {
				_.forEach(countdowns, countdown => {
					this.executeReminder(countdown);
				});
			});
		});
	}

	onSignupSuccess (botAccessToken, response) {
		console.log('signup success response', response);
	    const channel = _.get(response, 'incoming_webhook.channel_id');
	    if (channel) {
	      this._sayHello(channel, {token: botAccessToken});
	    } else {
	      console.log('no channel for some reason!');
	    }
	}

	onMessage (event) {
		let settings;
	    if (utils.isValidMessage(event)) {
	    	console.log('event received', event);
        	var type = utils.extractType(event);
        	switch (type) {
        		case 'help':
        			utils.extractSettings(event, 'idOnly').then(settings => {
	        			this._sendHelpResponse(event, settings);
        			})
        			break;
        		case 'start':
        			utils.extractSettings(event, 'date').then(settings => {
	        			if (settings.dumb) {
	        				this._noDumbPlease(event, settings);
	        			} else {
	        				this._startCountdown(settings, event);
	        			}
        			})
        			break;
        		case 'reset':
        			utils.extractSettings(event, 'date').then(settings => {
        				this._resetCountdown(settings, event);
        			})
        			break;
        		case 'schedule':
        			utils.extractSettings(event, 'schedule').then(settings => {
        				this._reformatChron(settings, event);
        			})
        			break;
        		case 'cancel':
        			utils.extractSettings(event, 'event').then(settings => {
        				this._cancelChron(settings, event);
        			})
        			break;
        		case 'delete':
        			utils.extractSettings(event, 'event').then(settings => {
        				this._deleteCountdown(settings, event);
        			})
        			break;
        		case 'list':
        			utils.extractSettings(event, 'idOnly').then(settings => {
        				this._listTeamEvents(event, settings);
        			})
        			break;
        		case 'countdown':
        			utils.extractSettings(event, 'countdown').then(settings => {
        				this._replyToChannel(event, settings);
        			})
        			break;
        		case 'hello':
        			utils.extractSettings(event, 'idOnly').then(settings => {
        				this._sayHello(event.event.channel, settings);
        			})
        			break;
        		default:    			
					utils.extractSettings(event, 'idOnly').then(settings => {
    					this._randomRepliesToChannel(event, settings);
    				});
        	}
    	}
	}

	_noDumbPlease (event, settings) {
		this.postMessage(event.event.channel, presets.nodumb, settings);
	}

	_sayHello (channel, settings) {
		this.postMessage(channel, presets.sayHello, settings);
	}

	_listTeamEvents (event, settings) {
		Countdown.find({teamId: settings.teamId}).then(function (countdowns) {
			var events = _.map(countdowns, function (countdown, index) {
				return `${index + 1}: ${countdown.event} _on_ ${moment(countdown.date).calendar()}`;
			});

			var reply = events.length > 0 ?
				`Your events:\n ${events.join('\n')}` :
				`You haven't listed any events yet! Ask for 'help' if you're having a ...ruff time!`;

			this.postMessage(event.event.channel, reply, settings);
		}.bind(this));
	}

	_sendHelpResponse (event, settings) {
		var helpMessage = `Happy to help! ${presets.help}`;
		this.postMessage(event.event.channel, helpMessage, settings);
	}

	isSillyType(sillyPhrases, event) {
		let text = event.event.text.toLowerCase();
		return _.some(sillyPhrases, phrase => phrase.test(text));
	}

	_randomRepliesToChannel(event, settings) {
		const dogSounds = [/arf/, /bark/, /woof/, /ruff/, /grrr/];
		const dogCommands = [/sit/, /stay/, /speak/, /roll over/, /shake/];
		const confused = [
			`Sorry, didn\'t quite catch that. Try again, or ask for "help". Woof woof.`,
			`Hmmm... <wags tail> <tilts head in confusion> Ask for "help" if you're confused too!`,
			`That doesn\'t seem right. Do you need help? Just ask for it!`,
			`I just don't know what you're getting at with that. You messin' with me? Just cause I'm a cute lil corgi?`,
			`Hmmm, try something else. That didn't seem to match any of my expectations. Ask for "help" if you need it!`,
			`Arf! I am confused by your request. I am very smart for a corgi, but I am still a corgi, after all. Ask for "help" if you need it!`
		];

		if (this.isSillyType(dogSounds, event)) {
			this.postMessage(event.event.channel, utils.pickRandom(dogSounds.source) + '!', settings);
		} else if (this.isSillyType(dogCommands, event)) {
			let command = _.filter(sillyPhrases, phrase => phrase.test(text));
			if (command.length > 0) {
				this.postMessage(event.channel, 
				`Dangit, I never learned how to ${command[0].source}. I only know how to count, read, write, and bark, embarrassingly enough.`, 
				settings);
			}

		} else {
			this.postMessage(event.event.channel,
				utils.pickRandom(confused),
				settings);
		}
	}

	_replyToChannel (event, settings) {
	    this._generateResponse(event, settings).then(function(response) {
	    	if (!!response) {
    			this.postMessage(event.event.channel, response, settings);
	    	}
	    }.bind(this));

	}

	_generateResponse (event, settings) {
		return Countdown.findOne({teamId: settings.teamId, event: settings.countdown}).then(function(countdown) {
			if (!countdown) {
    			this.postMessage(event.event.channel,
    				`Oh no! No countdown found for an event called "${settings.countdown}". Try asking me for "list" to see your currently active countdowns.`,
    				settings);
    			return;
			}

			let eventDate = moment(countdown.date);
			let today = moment();

			let days = Math.ceil(eventDate.diff(today, 'hours') / 24)
			let countdownEvent = countdown.event;
			let destination = countdown.destination;
			destination = countdown.destination === 'cities' ? utils.pickRandom(presets.cities) : countdown.destination;

			if (days <= 0) {
				this._deleteCountdown(settings, {event: countdownEvent}, true);
				return `Hooray! Today is the day for ${countdownEvent}! You lucky dowgs, you.`
			}

			return messageGenerator(days, countdownEvent, destination);
		}.bind(this));
	}

	_startCountdown(newSettings, event) {
		if (!utils.isValidCountdown(newSettings, event)) {
			var error = 'You must set both an event and a date.';
			this.postMessage(event.event.channel, error, newSettings);
			return;
		}

		Countdown.findOne({teamId: newSettings.teamId, event: newSettings.event})
			.then(function(countdown) {
				if (!!countdown) {
					this.postMessage(event.event.channel,
						`There's already a countdown for ${countdown.event}!`);
				} else {
					this._saveCountdown(newSettings, message);
				}
			}.bind(this));
	}

	_resetCountdown(newSettings, event) {
		if (!utils.isValidCountdown(newSettings)) {
			return;
		}

		_.assign(newSettings, {schedule: {rule: {hour: 10, dayOfWeek: 1}}});
		this._updateCountdown(
			newSettings,
			{teamId: newSettings.teamId, event: newSettings.event},
			newSettings,
			event,
			'I\'ve updated your event and started a new weekly countdown!'
		);
	}

	_saveCountdown(newSettings, event) {
		var scheduleId = newSettings.teamId + newSettings.event.split(' ').join('');

		Bot.findOne({teamId: newSettings.teamId}).then(bot => {
			if (_.isUndefined(bot)) {
				this.postMessage(event.event.channel, 
					`Something went wrong: I couldn't find your team's countdown registry! Email support at "countdown.to.counttown@gmail.com" for help.`)
			}

			var newCountdown = new Countdown({
				event: newSettings.event,
				botId: bot.userId,
				destination: newSettings.destination,
				date: newSettings.date,
				teamId: newSettings.teamId,
				channels: [	event.event.channel ],
				botAccessToken: newSettings.token,
				schedule: {
					id: scheduleId,
					rule: {hour: 10, dayOfWeek: 1},
					channel: event.event.channel
				}
			});

			newCountdown.save().then((countdown) => {
				console.log('saved new countdown!', countdown);

				this.postMessage(event.event.channel, 
					`I've created your new countdown for ${countdown.event}!`,
					newSettings)
			}).bind(this).catch((err) => {
				console.error(err);
			});
		})

	}

	_updateCountdown (settings, query, updatedCountdown, 
		event, successMessage = 'I\'ve updated your countdown!', successCb) {
		Countdown.findOneAndUpdate(query, updatedCountdown, {runValidators: true, new: true})
		.then(modifiedCountdown => {
			if (!modifiedCountdown) {
				this.postMessage(
					event.event.channel,
					`Couldn't find a countdown for that event...sorry. Try asking me for "list" to see your current countdowns!`,
					settings);
				return;
			}
	    	if (successCb) {
      			successCb(modifiedCountdown)
      		}	
      		if (successMessage) {
				this.postMessage(event.event.channel, successMessage, settings);
      		}

	    }).catch(err => {
        	return console.error(err);
			this.postMessage(event.event.channel, `There was an error updating your countdown.`, settings);
 	 	});
	}

	_deleteCountdown (settings, event, skipMessage) {
		Countdown.findOneAndRemove({teamId: settings.teamId, event: settings.event})
		.then(deleted => {
	    	if (!skipMessage) {
				this.postMessage(event.event.channel,
					`I've successfully removed ${settings.event} from your current countdowns.`,
					settings)
			}
	    }).catch((err) => {
        	console.error(err);
			this.postMessage(event.event.channel,
				`There was an error removing your countdown. Did you have the right event name?`,
				settings);
 	 	});
	}

	executeReminder (countdown) {
		var countdownEvent = countdown.event;
		var team = countdown.teamId;
		
		var reminder;
		var today = moment();
		var hours = moment(countdown.date).diff(today, 'hours');
		var rawDays = hours/24;
		var days = Math.ceil(rawDays);

		var settings = {team: team, token: countdown.botAccessToken};

		if (hours > 0 && hours < 24) {
			this._deleteCountdown(settings, {event: countdownEvent}, true);
			reminder = `Hooray! Today is the day for ${countdownEvent}! You lucky dowgs, you. I just removed that countdown for ya. Bark!`
		} else if (rawDays < 0) {
			this._deleteCountdown(settings, {event: countdownEvent}, true);
			reminder =`Looks like ${countdownEvent} already happened! I just went ahead and removed that countdown for ya. Arf!`
		} else {

			reminder = `And now for your scheduled reminder: ${days} ${days > 1 ? 'days' : 'day'} until ${countdownEvent}!`;
		}

		_.forEach([countdown.schedule.channel], channel => {
			this.postMessage(channel, reminder, settings);
		})
	}

	_removeChronJob (settings, event) {
		var query = {event: settings.event, teamId: settings.teamId};
		Countdown.findOne(query)
			.then(countdown => {
				countdown.schedule.rule.hour = null;
				countdown.schedule.rule.dayOfWeek = null;
				countdown.schedule.rule.channel = null;
				countdown.save().then(updated => {
					console.log(`I removed the scheduled reminder from ${updated.event}`);
				});
			});
	}

	_reformatChron (settings, event) {
		// Default to Monday at 10am
		// format: [second, minute, hour, day of month, month, day of week]
		var chron = {dayOfWeek: 1, hour: 10};
		var day = settings.day;
		var hour = settings.hour;
		var response, error;

		chron.hour = !!hour ? utils.handleHour(hour, chron.hour, event, settings, this) : chron.hour;
		if (settings.schedule === 'weekly') {
			if (!!day) {
				chron.dayOfWeek = utils.handleDay(day, chron.dayOfWeek, event, this, settings);
			}
		} else if (settings.schedule = 'daily') {
			chron.dayOfWeek = null;
		} else {
			error = 'I didn\'t quite get that. Try again, using "daily" or "weekly", or ask for help for more instructions.'
			this.postMessage(event.event.channel, err);
			return;
		}
		this._updateChron(settings, event, chron);
	}

	_updateChron (settings, event, rule) {
		var _this = this;
		if (!settings.event) {
			this.postMessage(
				event.event.channel,
				`Sorry, you need to specify which event you'd like to update! Ask me for the \`list\` if you don't remember the name`,
				settings)
		}
		
		var team = event.team_id || settings.teamId;
		this._updateCountdown(
			settings,
			{teamId: team, event: settings.event},
			{schedule: {rule: rule, channel: event.event.channel}},
			event,
			`I've updated your ${settings.schedule} scheduled reminder!`);
	}

	_cancelChron (settings, event) {
		this._removeChronJob(settings, event);

		this._updateCountdown(
			settings,
			{teamId: settings.teamId, event: settings.event},
			{schedule: {}},
			event,
			'I\'ve canceled your scheduled updates.');
	}
}

module.exports = CountdownBot;
