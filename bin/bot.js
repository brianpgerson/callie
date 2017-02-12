'use strict';

// I use dotenv to manage config vars. remove below if you do not.
// require('dotenv').config();


// TODOS:
/*
* LIST OF LENGTH ZERO EVENTS
*
*
*
*/
const CountdownBot = require('../lib/countdown'),
		cities = require('../data/cities'),
		mongoose = require('mongoose'),
		router = require('../router'),
		Bot = require('../lib/models/bot'),
		_ = require('lodash'),
		Countdown = require('../lib/models/countdown'),
		express = require('express'),
		app = express();


mongoose.Promise = require('bluebird');
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}:@jello.modulusmongo.net:27017/t2ipixUp`)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to DB!')
});

app.use("/public", express.static(__dirname));

app.listen(process.env.PORT || 1337, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

console.log(`Your server is running on port 1337.`);
router(app, db);

Bot.find({}).then(function (bots) {
	_.each(bots, function(bot) {
		var bootUpBot = new CountdownBot({
			token: bot.botAccessToken,
			db: db,
			name: 'callie'
		})

		bootUpBot.run();

		Countdown.find({botId: bot.botAccessToken}).then(function(countdown) {
			if (_.get(countdown, 'schedule.active')) {
				bootUpBot.handleNewChronJob(countdown);
			}
		});
	});
});

