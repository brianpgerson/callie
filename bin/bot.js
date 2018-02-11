'use strict';

// I use dotenv to manage config vars. remove below if you do not.
// require('dotenv').config();

const 	   CountdownBot = require('../lib/countdown'),
				 cities = require('../data/cities'),
		  	   mongoose = require('mongoose'),
				 router = require('../router'),
			   		Bot = require('../lib/models/bot'),
			 bodyParser = require('body-parser'),
	  				 _  = require('lodash'),
createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter,
			slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN),
		 	  Countdown = require('../lib/models/countdown'),
		   	    express = require('express'),
			 	  utils = require('../lib/utils'),
			   		app = express();


// initial setup
mongoose.Promise = require('bluebird');
const testDb = process.env.TEST_DB;
const prodDb = process.env.PROD_DB;

// database setup
const databaseUrl = isTestMode() ? testDb : prodDb;
console.log(databaseUrl)
mongoose.connect(databaseUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log(`Connected to DB in ${isTestMode() ? 'test mode' : 'live mode'}`));

// express setup
app.use(bodyParser.json());

const countdownBot = new CountdownBot();

// //\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\
// 					SLACK EVENT HANDLING
// /\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
app.use('/slack/events', slackEvents.expressMiddleware());

slackEvents.on('message.channels', (event) => {
	console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
});

slackEvents.on('app_mention', (event) => {
	console.log('hey, a message of some type:', event)
 	countdownBot.onMessage(event);
	}
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);


app.use("/public", express.static(__dirname));
app.listen(process.env.PORT || 1337, function () {
	console.log(`Server listening on port ${this.address().port}`)
});

// business logic begins
router(app, db, countdownBot);

setTimeout(function() {
	countdownBot.initiateScheduler();
}, 1000);


function isTestMode() {
	return process.env.NODE_ENV === 'test_env';
}
