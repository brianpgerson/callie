/* use-strict */

import R from 'ramda';

import { notify } from '../services/message.service';

import updateCountdown from '../queries/updateCountdown';
import { isSuccessful } from '../utils/general';

const resetCountdown = async (configuration) => {
  const { settings: { date, event } } = configuration;
  if (!date || !event) {
    notify('You must set both an event and a date.', configuration);
    return;
  }

  const updated = await updateCountdown(configuration, { event, date });

  R.ifElse(
    isSuccessful,
    () => notify(`I've updated your countdown reminder for ${event}!`, configuration),
    ({ message }) => notify(message, configuration),
  )(updated);
}

export default resetCountdown;