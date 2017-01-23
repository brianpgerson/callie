'use strict';

// I use dotenv to manage config vars. remove below if you do not.
// require('dotenv').config();

const CountdownBot = require('../lib/countdown'),
		cities = require('../data/cities'),
		mongoose = require('mongoose'),
		router = require('../router'),
		express = require('express'),
		app = express();


mongoose.Promise = require('bluebird');
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}:@jello.modulusmongo.net:27017/t2ipixUp`)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to DB!')
});

app.use("/public", express.static(__dirname));

app.listen(process.env.PORT || 1337, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

console.log(`Your server is running on port 1337.`);
router(app, db);

