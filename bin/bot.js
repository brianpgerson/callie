'use strict';

// I use dotenv to manage config vars. remove below if you do not.
require('dotenv').config();

var CountdownBot = require('../lib/countdown');
var cities = require('../data/cities');
var token = process.env.BOT_API_KEY;
var _ = require('lodash');
var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}:@jello.modulusmongo.net:27017/t2ipixUp`)

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected!')
});

var thecount = new CountdownBot({
    token: token,
    db: db,
    name: 'thecount'
});

thecount.run();

