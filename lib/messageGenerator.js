var utils = require('./utils'),
		_ = require('lodash');
module.exports = function (days, event, destination) {

	function destinationClause(destination) {
		if (_.isUndefined(destination)) {
			return '';
		}
		return `you head to ${destination} for `;
	}

	const standardMessages = [
		`Grrrrr... er, glad you asked! There are ${days} days until ${destinationClause(destination)}${event}!`,
		`Let me check the schedule. Ah, yes: ${days} days until ${destinationClause(destination)}${event}!`,
		`How exciting! There are only ${days} days until ${destinationClause(destination)}${event}!`,
		`Well, if you must know...BARK! There remain ${days} days until ${destinationClause(destination)}${event}!`,
		`Arf! As far as I know, there are precisely ${days} days until ${destinationClause(destination)}${event}!`,
		`Woof woof woof. Oh, I mean, there are ${days} days until ${destinationClause(destination)}${event}!`,
		`My pleasure! Only ${days} days until ${destinationClause(destination)}${event}!`
	];

	const closeMessages = [
		`Oh boy oh boy oh boy, only ${days} days until ${destinationClause(destination)}${event}!`,
		`Wow, it's getting really close! ARF! Just ${days} days to go until ${destinationClause(destination)}${event}...Bark!`,
		`Time's really flyin' by - there are just ${days} days until ${destinationClause(destination)}${event}!`,
		`<tail wags> <more tail wags> Only ${days} days until ${destinationClause(destination)}${event}...Arf!`,
		`Hoooo boy, just ${days} days until ${destinationClause(destination)}${event}! Who's a good dog?!?!`,
		`RrrrrWOOF! The countdown is...${days} days until ${destinationClause(destination)}${event}!`,
		`Buckle up, team...only ${days} days until ${destinationClause(destination)}${event}!`
	];

	return days < 10 ? utils.pickRandom(closeMessages) : utils.pickRandom(standardMessages);
}
