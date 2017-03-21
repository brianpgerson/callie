const express = require('express'),
		path = require('path'),
		Bot = require('./lib/models/bot'),
		_ = require('lodash'),
		serveStatic = require('serve-static'),
		CountdownBot = require('./lib/countdown');
	    Slack = require('slack-node');


module.exports = function(app, db) {
	slack = new Slack();
  	// Initializing route groups

  	app.use("/", express.static(__dirname + '/public/'));

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
  			if (!!err || !response.bot) {
  				console.error(err);
  				res.status(500).sendFile(path.join(__dirname + '/public/error.html'));
  			} else {
  				const botAccessToken = response.bot.bot_access_token;
  				const botId = response.bot.bot_user_id;
  				const teamId = response.team_id;

  				Bot.findOne({teamId: teamId}).then(function (bot) {
  					if (bot) {
              console.error('bot already exists for team', teamId);
  						res.sendFile(path.join(__dirname + '/public/oops.html'));
  					} else {
  						const bot = new Bot({
		  					botAccessToken: botAccessToken,
		  					userId: botId,
		  					teamId: teamId
		  				});

		  				bot.save().then(function (bot) {
		  					const countdownBot = new CountdownBot({
  		    					token: botAccessToken,
  		    					db: db,
  		    					name: 'callie'
  							});

  							countdownBot.run();
                console.log(response);
                const channel = _.get(response, 'incoming_webhook.channel');
                console.log(channel)
                if (channel) {
                  countdownBot.hello(channel);
                }

		  					res.sendFile(path.join(__dirname + '/public/thanks.html'));
		  				});
  					}
  				});
  			}
  		});
  	});

  	app.use('/*', (req, res) => {
		res.status(500).sendFile(path.join(__dirname + '/public/error.html'));
  	});
};
