'use strict';

require('dotenv').config();
var CountdownBot = require('../lib/countdown');
var cities = require('../data/cities');
var token = process.env.BOT_API_KEY;

var thecount = new CountdownBot({
    token: token,
    name: 'thecount',
    destination: cities,
    event: 'Mystery Trip',
    date: '2017-03-09'
});

thecount.run();

