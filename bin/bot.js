'use strict';

// I use dotenv to manage config vars. remove below if you do not.
require('dotenv').config();

var CountdownBot = require('../lib/countdown');
var cities = require('../data/cities');
var token = process.env.BOT_API_KEY;
var _ = require('lodash');

var thecount = new CountdownBot({
    token: token,
    name: 'thecount',
    destination: 'your awesome place',
    event: 'New Years Eve',
    date: '2017-12-31',
    chron: '* * 10 * * 1'   // see https://www.npmjs.com/package/node-schedule
    				    	// for formatting info on chron rules
});

thecount.run();

