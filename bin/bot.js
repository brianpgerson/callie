'use strict';
require('dotenv').config();

var CountdownBot = require('../lib/countdown');

var token = process.env.BOT_API_KEY;

var thecount = new CountdownBot({
    token: token,
    name: 'thecount',
    dateString: '2017-03-09'
});

thecount.run();
