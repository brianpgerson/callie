'use strict';

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

schedule.scheduleJob('* * * * 1', function(){
  	_.each(thecount.channels, function(channel) {
  		var message = `Weekly update: ${thecount._generateResponse()e}`;
  		thecount.postMessage(channel, message, {as_user: thecount.user.name});
  	});
});

thecount.run();

