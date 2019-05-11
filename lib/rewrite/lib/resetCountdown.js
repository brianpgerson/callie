/* use-strict */

import R from 'ramda';

import { notify } from '../services/message.service';

import updateCountdown from '../queries/updateCountdown';
import { hasDateAndEvent, isSuccessful } from '../utils/general';

const resetCountdown = (configuration) => R.ifElse(
  hasDateAndEvent,
  R.pipe(
    R.assocPath(['settings', 'schedule'], { channel: configuration.channel, rule: { hour: 10, dayOfWeek: 1 } } ),
    updates => await updateCountdown(configuration, updates),
    R.ifElse(
      isSuccessful,
      () => notify(`I've updated your countdown reminder for ${configuration.settings.event}!`)(configuration),
      ({ message }) => notify(message)(configuration),
    )
  ),
  notify('You must set both an event and a date.')
)(configuration)

export default resetCountdown;