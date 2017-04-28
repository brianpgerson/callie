'use strict';

// I use dotenv to manage config vars. remove below if you do not.
// require('dotenv').config();


const CountdownBot = require('../lib/countdown'),
		cities = require('../data/cities'),
		mongoose = require('mongoose'),
		router = require('../router'),
		Bot = require('../lib/models/bot'),
		_ = require('lodash'),
		Countdown = require('../lib/models/countdown'),
		express = require('express'),
		utils = require('../lib/utils'),
		app = express();


mongoose.Promise = require('bluebird');
const testDb = `mongodb://localhost/countdown-test`;
const newDb = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@ds123991-a0.mlab.com:23991,ds123991-a1.mlab.com:23991/callie?replicaSet=rs-ds123991`;
const prodDB = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}:@jello.modulusmongo.net:27017/t2ipixUp`;
const databaseUrl = isTestMode() ? testDb : newDb;

mongoose.connect(databaseUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log(`connected to DB in ${isTestMode() ? 'test mode' : 'live mode'}`);
});

app.use("/public", express.static(__dirname));

app.listen(process.env.PORT || 1337, function(){
  console.log(`Express server listening on port ${this.address().port}`);
});

router(app, db);

if (isTestMode()) {
	bootUpTestModeBot();
} else {
	Bot.find({}).then(function (bots) {
		restartBots(bots);
	});
}

function restartBots (bots) {
	_.each(bots, function(bot) {
		var bootUpBot = new CountdownBot({
			token: bot.botAccessToken,
			db: db,
			name: 'callie'
		});

		bootUpBot.run();
		Countdown.find({botId: bot.userId}).then(function(countdowns) {
			_.forEach(countdowns, function (countdown) {
				console.log('booting up:', countdown.event);
				const channel = _.get(countdown, 'schedule.channel');
				if (!_.isUndefined(channel)) {
					console.log('restarting chron:', countdown.event);
					bootUpBot.handleNewChronJob(countdown, {channel: channel, team: countdown.teamId});
				}
				console.log('done', countdown.event);
			});
		}).catch(function(err) {
			console.log(err, bot.botAccessToken);
		});
	});
}

function bootUpTestModeBot () {
	Bot.findOneAndRemove({userId: 'testbotkey'}).then(function() {
		const bot = new Bot({
			botAccessToken: process.env.TEST_BOT_KEY,
			userId: 'testbotkey',
			teamId: process.env.TEST_TEAM_ID
		});

		bot.save().then(function (bot) {
			console.log(bot);
			const countdownBot = new CountdownBot({
				token: process.env.TEST_BOT_KEY,
				db: db,
				name: 'callietest'
			});
			countdownBot.run();
		});
	});
}


function isTestMode() {
	return process.env.NODE_ENV === 'test_env';
}
