'use strict';

// I use dotenv to manage config vars. remove below if you do not.
// require('dotenv').config();

const CountdownBot = require('../lib/countdown'),
			cities = require('../data/cities'),
		  mongoose = require('mongoose'),
			router = require('../router'),
			   Bot = require('../lib/models/bot'),
				 _ = require('lodash'),
			 Relax = require('relax-js'),
		 Countdown = require('../lib/models/countdown'),
		   express = require('express'),
			 utils = require('../lib/utils'),
			   app = express();


mongoose.Promise = require('bluebird');
const testDb = `mongodb://${process.env.TEST_MONGO_USER}:${process.env.TEST_MONGO_PASSWORD}@ds147274.mlab.com:47274/callie-test`;
const prodDb = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@ds123991-a0.mlab.com:23991,ds123991-a1.mlab.com:23991/callie?replicaSet=rs-ds123991`;
const databaseUrl = isTestMode() ? testDb : prodDb;
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

const relax = new Relax();
const countdownBot = new CountdownBot();

setup(relax, countdownBot);

setTimeout(function() {
	countdownBot.initiateScheduler();
}, 1000);

function restartBots () {
	Bot.find({}).then(bots => {
		let addedBots = {};
		_.forEach(bots, function (bot) {
			console.log('booting up:', bot.teamName, bot.teamId);

			if (_.isUndefined(addedBots[bot.teamId])) {
				const botAccessToken = _.get(bot, 'botAccessToken');
				const teamId = _.get(bot, 'teamId');

				console.log(botAccessToken, teamId);

				relax.startBot(teamId, botAccessToken);
				addedBots[teamId] = true;

				console.log(`done for ${bot.teamName}`);
			} else {
				console.log(`this is odd: more than one bot found for ${bot.teamId}`)
			}
		});
	}).catch(function(err) {
		console.log('error during boot:', err, countdown.botId);
	});
}

function setup (relax, countdownBot) {
	relax.on('message_new', function (data) {
		console.log(data);
  		countdownBot.onMessage(data);
	});

	relax.on('disable_bot', data => console.log('failed', data))

	relax.start();

	console.log('started for', relax);
	router(app, db, relax, countdownBot);
	restartBots();
}


function isTestMode() {
	return process.env.NODE_ENV === 'test_env';
}
