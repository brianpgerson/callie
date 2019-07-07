const express = require('express'),
		 path = require('path'),
		  Bot = require('./lib/models/bot'),
		    _ = require('lodash'),
  serveStatic = require('serve-static'),
	SlackNode = require('slack-node');
		slack = new SlackNode();	

function handleSignup (req, res, countdownBot) {
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
						countdownBot.onSignupSuccess(botAccessToken, response);
						res.sendFile(path.join(__dirname + '/public/success.html'));
					});
				}
			});
		}
	}); 
}


module.exports = function(app, db, countdownBot) {
	// Initializing route groups
	app.use("/", express.static(__dirname + '/public/'));

	app.get('/success', (req, res) => handleSignup(req, res, countdownBot));

	// Handle any other bad routes
	app.use('/*', (req, res) => {
		res.status(500).sendFile(path.join(__dirname + '/public/error.html'));
	});
};
