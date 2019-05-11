'use strict'

const help = require('./help'),
	  sayHello = require('./sayHello'),
	  nodumb = require('./nodumb'),
	  cities = require('./cities');

const presets = {
	help: help,
	sayHello: sayHello,
	nodumb: nodumb,
	cities: cities
};

export default presets;
