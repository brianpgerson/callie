const express = require('express'),
		path = require('path'),
		Bot = require('./lib/models/bot'),
		CountdownBot = require('./lib/countdown');
	    Slack = require('slack-node');


module.exports = function(app, db) {
	slack = new Slack();
  	// Initializing route groups
  	app.get('/', (req, res) => {
	    res.sendFile(path.join(__dirname + '/public/pages/index.html'));
  	});

  	app.get('/thanks', (req, res) => {
  		code = req.query.code;
  		if (!code) {
  			console.log('no code! why?!');
  		}

  		slack.api('oauth.access', {
  			client_id: process.env.SLACK_CLIENT,
  			client_secret: process.env.SLACK_SECRET,
  			code: code
  		}, function (err, response) {
  			if (!!err) {
  				console.error(err);
  				res.status(500).sendFile(path.join(__dirname + '/public/pages/error.html'));
  			} else {
  				const botAccessToken = response.bot.bot_access_token;
  				const botId = response.bot.bot_user_id;
  				const teamId = response.team_id;

  				const bot = new Bot({
  					botAccessToken: botAccessToken,
  					userId: botId,
  					teamId: teamId
  				});

  				bot.save().then(function (bot) {
  					const countdownBot = new CountdownBot({
    					token: botAccessToken,
    					db: db,
    					name: 'thecount'
					});

					countdownBot.run();
  					res.sendFile(path.join(__dirname + '/public/pages/thanks.html'));
  				});
  			}
  		})

  	})
};
