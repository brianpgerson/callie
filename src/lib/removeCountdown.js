/* use-strict */

import R from 'ramda';

import { notify } from '../services/message.service';

import deleteCountdown from '../queries/deleteCountdown';
import { isSuccessful } from '../utils/general';

const removeCountdown = async (configuration) =>  {
  const deleted = await deleteCountdown(configuration);  
  R.ifElse(
    isSuccessful,
    () => notify(`I've deleted your countdown for ${configuration.settings.event}!`, configuration),
    ({ message }) => notify(message, configuration),
  )(deleted)
}

export default removeCountdown;