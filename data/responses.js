'use strict';

var cities = require('./cities');

class ResponseGenerator  {
	Constructor(settings) {
		 this.openers = [
	    	'Glad you asked! There are ',
	    	'Let me check the schedule. Ah, yes - ',
	    	'How exciting. There are only ',
	    	'Well if you must know, there remain ',
	    	'As far as I know, there are precisely '
	    ];

	    this.enders = [
		    'days remaining until you all make the journey to ',
		    'days left until the mystery trip to ',
		    'days until you find yourself on a flight to ',
		    'days until your epic outing to '
    	];
	}

    generateResponse () {
		var city = Math.floor(Math.random() * cities.length);
		return pickRandom(this.openers) + city + pickRandom(this.enders);
	}

	pickRandom (options) {
		return options[Math.floor(Math.random() * options.length)];
	}

};

module.exports = ResponseGenerator;

