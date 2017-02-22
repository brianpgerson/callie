var utils = require('./utils');

module.exports = function (days, event, destination) {

	function destinationClause(destination) {
		if (!!destination) {
			return '';
		}
		return `you head to ${destination} for `;
	}

	const standardMessages = [
		`Grrrrr... er, glad you asked! There are ${days} until ${destinationClause(destination)}${event}!`,
		`Let me check the schedule. Ah, yes: ${days} until ${destinationClause(destination)}${event}!`,
		`How exciting! There are only ${days} until ${destinationClause(destination)}${event}!`,
		`Well, if you must know...BARK! There remain ${days} until ${destinationClause(destination)}${event}!`,
		`Arf! As far as I know, there are precisely ${days} until ${destinationClause(destination)}${event}!`,
		`Woof woof woof. Oh, I mean, there are ${days} until ${destinationClause(destination)}${event}!`,
		`My pleasure! Only ${days} until ${destinationClause(destination)}${event}!`
	];

	const closeMessages = [
		`Oh boy oh boy oh boy, only ${days} until ${destinationClause(destination)}${event}!`,
		`Wow, it's getting really close! ARF! Just ${days} to go until ${destinationClause(destination)}${event}...Bark!`,
		`Time's really flyin' by - there are just ${days} until ${destinationClause(destination)}${event}!`,
		`<tail wags> <more tail wags> Only ${days} until ${destinationClause(destination)}${event}...Arf!`,
		`Hoooo boy, just ${days} until ${destinationClause(destination)}${event}! Who's a good dog?!?!`,
		`RrrrrWOOF! The countdown is...${days} until ${destinationClause(destination)}${event}!`,
		`Buckle up, team...only ${days} until ${destinationClause(destination)}${event}!`
	];

	return days < 10 ? utils.pickRandom(closeMessages) : utils.pickRandom(standardMessages);
}
