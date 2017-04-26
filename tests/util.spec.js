'use strict'

const should = require('should');
const _ = require('lodash');
const Utils = require('../lib/utils');

describe('The transaction parser', () => {
  	it('should have a thing?', () => {
    	should.exist(Utils.extractType);
  	});

  	it('should parse message types', () => {
  		const testCases = {
  			hello: '<21324> hello you dummy',
  			hello: '<21324> hello start cancel help',
  			help: '<21324> help please!',
			start: '<21324> start asdf;lakj',
			reset: '<21324> reset reset reset',
			undefined: '<21324> barf'
  		};

  		_.forEach(testCases, (string, key) => {
	  		const type = Utils.extractType({text: string});
	  		key = key === 'undefined' ? undefined : key;
	  		should.equal(type, key);
  		})
  	});
});


