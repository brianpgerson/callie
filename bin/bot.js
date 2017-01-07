'use strict';

// I use dotenv to manage config vars. remove below if you do not.
// require('dotenv').config();

var CountdownBot = require('../lib/countdown');
var cities = require('../data/cities');
var token = process.env.BOT_API_KEY;
var schedule = require('node-schedule');
var _ = require('lodash');

var thecount = new CountdownBot({
    token: token,
    name: 'thecount',
    destination: cities,
    event: 'Mystery Trip',
    date: '2017-03-09'
});

schedule.scheduleJob('* * 10 * 1', function(){
  	_.each(thecount.channels, function(channel) {
  		var message = `Weekly update: ${thecount._generateResponse()}`;
  		thecount.postMessage(channel, message, {as_user: thecount.user.name});
  	});
});

thecount.run();

