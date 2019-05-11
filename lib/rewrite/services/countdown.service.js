import R from 'ramda';

import { notify } from './message.service';
import startCountdown from '../lib/startCountdown';
import saveCountdown from '../queries/saveCountdown';

import presets from '../data/presets';
import { MESSAGE_TYPES } from '../constants';

const typeEq = R.propEq('type');

const handleIntermediateActions = (configuration) => R.pipe(
  R.cond([
    [typeEq(MESSAGE_TYPES.HELP), notify(presets.help)],
    [typeEq(MESSAGE_TYPES.START), startCountdown],
    [typeEq(MESSAGE_TYPES.RESET), resetCountdown],
    [typeEq(MESSAGE_TYPES.SCHEDULE), ],
    [typeEq(MESSAGE_TYPES.CANCEL), ],
    [typeEq(MESSAGE_TYPES.DELETE), ],
    [typeEq(MESSAGE_TYPES.LIST), ],
    [typeEq(MESSAGE_TYPES.COUNTDOWN), ],
    [typeEq(MESSAGE_TYPES.HELLO), ],
    [typeEq(MESSAGE_TYPES.UNKNOWN), ],
  ])
)(configuration)

switch (type) {
  case 'schedule':
    utils.extractSettings(event, 'schedule').then(settings => {
      this._reformatChron(settings, event);
    })
    break;
  case 'cancel':
    utils.extractSettings(event, 'event').then(settings => {
      this._cancelChron(settings, event);
    })
    break;
  case 'delete':
    utils.extractSettings(event, 'event').then(settings => {
      this._deleteCountdown(settings, event);
    })
    break;
  case 'list':
    utils.extractSettings(event, 'idOnly').then(settings => {
      this._listTeamEvents(event, settings);
    })
    break;
  case 'countdown':
    utils.extractSettings(event, 'countdown').then(settings => {
      this._replyToChannel(event, settings);
    })
    break;
  case 'hello':
    utils.extractSettings(event, 'idOnly').then(settings => {
      this._sayHello(event.event.channel, settings);
    })
    break;
  default:    			
utils.extractSettings(event, 'idOnly').then(settings => {
    this._randomRepliesToChannel(event, settings);
  });
}