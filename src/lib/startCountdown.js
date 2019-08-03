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
const notifyNoBrackets = notify(`Please don't use "<" and ">" in your settings. I used them to make it clear what YOUR inputs should be, but if you keep them in your event name, for example, it'll be hard to find your event later!`);
const notifyNeedDateAndEvent = notify('You must set both an event and a date.');
const usedBrackets = ({ settings: { event }}) => (R.indexOf('&lt;', event) === 0 && R.indexOf('&gt;', event) > 0);
const saveCountdownAndNotifyResults = async (configuration) => {
  const countdown = await saveCountdown(configuration);
  return R.ifElse(
    isSuccessful,
    () => notify(`I've created your new countdown for ${configuration.settings.event}!`, configuration),
    () => notify('Hmmm, something went wrong. Try that again.', configuration),
  )(countdown);
}

const startCountdown = async (configuration) => {
  if (!hasDateAndEvent(configuration)) {
    notifyNeedDateAndEvent(configuration);
    return;
  }

  if (usedBrackets(configuration)) {
    notifyNoBrackets(configuration);
    return;
  }
  
  
  const alreadyCountdown = await findCountdown(configuration);
  R.ifElse(
    R.isNil,
    () => saveCountdownAndNotifyResults(configuration),
    notifyAlreadyCountdown,
  )(alreadyCountdown);
}
  

export default startCountdown;