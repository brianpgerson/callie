import R from 'ramda';

import { notify } from './message.service';
import startCountdown from '../lib/startCountdown';
import resetCountdown from '../lib/resetCountdown';
import setSchedule from '../lib/setSchedule';
import cancelReminder from '../lib/cancelReminder';
import removeCountdown from '../lib/removeCountdown';
import getCountdown from '../lib/getCountdown';
import listTeamEvents from '../lib/listCountdowns';

import { generateRandomReply } from './message.service'

import presets from '../data/presets';
import { MESSAGE_TYPES } from '../constants/constants';

const typeEq = R.propEq('type');

const handleIntermediateActions = (configuration) => 
  R.cond([
    [typeEq(MESSAGE_TYPES.HELP), notify(presets.help)],
    [typeEq(MESSAGE_TYPES.START), startCountdown],
    [typeEq(MESSAGE_TYPES.RESET), resetCountdown],
    [typeEq(MESSAGE_TYPES.SCHEDULE), setSchedule],
    [typeEq(MESSAGE_TYPES.CANCEL), cancelReminder],
    [typeEq(MESSAGE_TYPES.DELETE), removeCountdown],
    [typeEq(MESSAGE_TYPES.LIST), listTeamEvents],
    [typeEq(MESSAGE_TYPES.COUNTDOWN), getCountdown],
    [typeEq(MESSAGE_TYPES.HELLO), notify(presets.hello)],
    [typeEq(MESSAGE_TYPES.UNKNOWN), generateRandomReply],
    [R.T, () => {}],
  ])(configuration)

export default handleIntermediateActions;