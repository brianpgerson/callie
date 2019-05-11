/* use-strict */

import R from 'ramda';

import { notify } from '../services/message.service';

import findCountdown from '../queries/findCountdown';
import saveCountdown from '../queries/saveCountdown';
import { hasDateAndEvent, getEventFromSettings, isSuccessful } from '../utils/general';

const notifyAlreadyCountdown = R.pipe(
  getEventFromSettings,
  event => notify(`There's already a countdown for ${event}`)
);

const notifyNeedDateAndEvent = notify('You must set both an event and a date.');

const saveCountdownAndNotifyResults = async (configuration) => R.pipe(
  await saveCountdown,
  R.ifElse(
    isSuccessful,
    () => notify(`I've created your new countdown for ${configuration.settings.event}!`)(configuration),
    () => notify('Hmmm, something went wrong. Try that again.'),
  )
)(configuration);


const startCountdown = async (configuration) => 
  R.ifElse(
    hasDateAndEvent,
    R.ifElse(
      R.pipe(findCountdown, R.isNil),
      await saveCountdownAndNotifyResults,
      notifyAlreadyCountdown,
    ),
    notifyNeedDateAndEvent,
  )(configuration);

export default startCountdown;