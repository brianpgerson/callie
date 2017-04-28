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

  	it('should extract settings', () => {
  		const testCases = [
  			['date', {text: 'start date: 2018-04-03, event: cool'}],
  			['date', {text: 'start date: 2018-04-13, event: cool, destination: funtown'}],
  			['date', {text: 'reset date: 2018-04-03, event: cool'}],
  			['date', {text: 'start date: 2018-04-03, event: cool, bark: whatever'}],
  			['schedule', {text: 'schedule: weekly, day: sunday, event: cool'}],
  			['schedule', {text: 'schedule: weekly, day: tuesday, hour: 11, event: cool'}],
  			['schedule', {text: 'schedule: daily, hour: 12, event: cool'}],
  			['schedule', {text: 'schedule: daily, event: cool'}]
  		];

  		const results = [
  			{date: '2018-04-03', event: 'cool'},
  			{date: '2018-04-13', event: 'cool', destination: 'funtown'},
  			{date: '2018-04-03', event: 'cool'},
  			{date: '2018-04-03', event: 'cool'},
  			{schedule: 'weekly', day: 'sunday', event: 'cool'},
  			{schedule: 'weekly', day: 'tuesday', hour: 12, event: 'cool'},
  			{schedule: 'daily', hour: 12, event: 'cool'},
  			{schedule: 'daily', event: 'cool'}
  		]

  		_.forEach(testCases, (testCase, idx) => {
  			const settings = Utils.extractSettings(testCase[1], testCase[0]);
  			_.every(settings, (value, key) => should.equal(results[idx][key], value))
  		});
  	})
});
