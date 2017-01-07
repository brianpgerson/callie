'use strict';

var CountdownBot = require('../lib/countdown');

var token = process.env.BOT_API_KEY;

var thecount = new CountdownBot({
    token: token,
    name: 'thecount',
    dateString: '3/9/2017'
});

thecount.run();
