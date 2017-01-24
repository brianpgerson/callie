'use strict'

const help = require('./help'),
	  sayHello = require('./sayHello'),
	  cities = require('./cities'),
	  openers = require('./openers'),
	  enders = require('./enders');

module.exports = {
	help: help,
	sayHello: sayHello,
	cities: cities,
	openers: openers,
	enders: enders
}
