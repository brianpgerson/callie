var utils = require('./utils'),
		_ = require('lodash');
module.exports = function (days, event, destination) {

	function destinationClause(destination) {
		if (_.isUndefined(destination)) {
			return '';
		}
		return `you head to ${destination} for `;
	}

	const multiDay = days > 1;
	const daysLeft = multiDay ? 'days' : 'day';
	const areOrIs = multiDay ? 'are' : 'is';

	const standardMessages = [
		`Grrrrr... er, glad you asked! There ${areOrIs} ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`Let me check the schedule. Ah, yes: ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`How exciting! There ${areOrIs} only ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`Well, if you must know...BARK! There remain${multiDay ? '' : 's'} ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`Arf! As far as I know, there ${areOrIs} precisely ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`Woof woof woof. Oh, I mean, there ${areOrIs} ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`My pleasure! Only ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`
	];

	const closeMessages = [
		`Oh boy oh boy oh boy, only ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`Wow, it's getting really close! ARF! Just ${days} ${daysLeft} to go until ${destinationClause(destination)}${event}...Bark!`,
		`Time's really flyin' by - there ${areOrIs} just ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`<tail wags> <more tail wags> Only ${days} ${daysLeft} until ${destinationClause(destination)}${event}...Arf!`,
		`Hoooo boy, just ${days} ${daysLeft} until ${destinationClause(destination)}${event}! Who's a good dog?!?!`,
		`RrrrrWOOF! The countdown is...${days} ${daysLeft} until ${destinationClause(destination)}${event}!`,
		`Buckle up, team...only ${days} ${daysLeft} until ${destinationClause(destination)}${event}!`
	];

	return days < 10 ? utils.pickRandom(closeMessages) : utils.pickRandom(standardMessages);
}
