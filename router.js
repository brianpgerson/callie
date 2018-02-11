const express = require('express'),
		 path = require('path'),
		  Bot = require('./lib/models/bot'),
		    _ = require('lodash'),
  serveStatic = require('serve-static'),
 CountdownBot = require('./lib/countdown'),
	SlackNode = require('slack-node');
		slack = new SlackNode();	

function eventIsLegit(event) {
	return process.env.SLACK_VERIFICATION_TOKEN === event.token;
}

function handleSignup (req, res) {
	let code = req.query.code;
	slack.api('oauth.access', {
		client_id: process.env.SLACK_CLIENT,
		client_secret: process.env.SLACK_SECRET,
		code: code
	}, function (err, response) {
		if (!!err || !response.bot) {
			console.error(err);
			res.status(500).sendFile(path.join(__dirname + '/public/error.html'));
		} else {
			const botAccessToken = response.bot.bot_access_token;
			const botId = response.bot.bot_user_id;
			const teamId = response.team_id;
			const teamName = response.team_name;

			Bot.findOne({teamId: teamId}).then(function (bot) {
				if (bot) {
					console.error('bot already exists for team', teamId);
					res.sendFile(path.join(__dirname + '/public/oops.html'));
				} else {
					const bot = new Bot({
						botAccessToken: botAccessToken,
						userId: botId,
						teamId: teamId,
						teamName: teamName
					});

					bot.save().then(bot => {
						CountdownBot.onSignupSucces(response, botAccessToken);
						res.sendFile(path.join(__dirname + '/public/thanks.html'));
					});
				}
			});
		}
	}); 
}


module.exports = function(app, db, countdownBot, slackEvents) {
	// Initializing route groups
	app.use("/", express.static(__dirname + '/public/'));

	app.get('/thanks', (req, res) => handleSignup(req, res));

	app.use('/*', (req, res) => {
		res.status(500).sendFile(path.join(__dirname + '/public/error.html'));
	});

	// //\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\//\
	// 					SLACK EVENT HANDLING
	// /\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\

	// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im

	slackEvents.on('message', (event)=> {
		console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
	});

	slackEvents.on('app_mention', (event)=> {
		console.log('hey, a mention!', event);
		if (eventIsLegit(event)) {
		 	CountdownBot.onMessage(event);
		} else {
			console.error('Token incorrect for event: ', event);
		}
	});

	// Handle errors (see `errorCodes` export)
	slackEvents.on('error', console.error);
};
