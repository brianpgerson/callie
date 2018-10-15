'use strict';

// I use dotenv to manage config vars. remove below if you do not.
if (process.env.NODE_ENV==="test_env") {
	require('dotenv').config();
}

const 	   CountdownBot = require('../lib/countdown'),
		  	   mongoose = require('mongoose'),
				 router = require('../router'),
			 bodyParser = require('body-parser'),
	  				 _  = require('lodash'),
createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter,
			slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
							includeBody: true,
							includeHeaders: true
						}),
		   	    express = require('express'),
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

app.use(bodyParser({limit: "15MB"}));

const countdownBot = new CountdownBot();

// //\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\
// 					SLACK EVENT HANDLING
// /\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
app.use('/slack/events', slackEvents.expressMiddleware());

slackEvents.on('app_mention', (event, body) => {
	console.log('hey, a message of some type:', body)
 	countdownBot.onMessage(body);
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);

slackEvents.on('app_uninstalled', event => {
	console.log('Ready to delete bot! ', event);
	countdownBot.deleteBot(event.team_id);
});

slackEvents.on('tokens_revoked', event => {
	console.log('Tokens revoked for bot! ', event);
	countdownBot.deleteBot(event.team_id);
});

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
