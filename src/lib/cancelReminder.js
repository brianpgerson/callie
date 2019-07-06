import R from 'ramda';

import { notify } from '../services/message.service';

import updateCountdown from '../queries/updateCountdown';
import { isSuccessful } from '../utils/general';

const cancelReminder = (configuration) => {
  const reset = { schedule: { channel: configuration.channel, rule: { hour: null, dayOfWeek: null } } };
  updateAndNotify(reset, configuration);
}

const updateAndNotify = async (updates, configuration) => {  
  const updated = await updateCountdown(configuration, updates);  
  R.ifElse(
    isSuccessful,
    () => notify(`I've canceled your countdown reminder for ${configuration.settings.event}!`, configuration),
    ({ message }) => notify(message, configuration),
  )(updated);
}
  
  export default cancelReminder;