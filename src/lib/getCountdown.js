/* use-strict */

import R from 'ramda';
import moment from 'moment';
import { notify, generateCountdownMessage } from '../services/message.service';
import findCountdown from '../queries/findCountdown';
import deleteCountdown from '../queries/deleteCountdown';
import { isSuccessful } from '../utils/general';

const getDaysUntilEvent = R.pipe(
  R.prop('date'),
  moment,
  date => date.diff(moment().tz("America/Los_Angeles"), 'hours'),
  R.divide(R.__, 24),
  Math.ceil
)

const getDestination = R.pipe(
  R.prop('destination'),
  R.when(
    R.equals('cities'),
    () => randomCity
  ),
);

const buildMessageDetails = R.applySpec({
  daysUntilEvent: getDaysUntilEvent,
  destination: getDestination,
  event: R.prop('event'),
})

const isTodayOrPast = R.propSatisfies(R.gte(0), 'daysUntilEvent');

const getCountdown = async (configuration) => {
  const { settings: { event }} = configuration;
  const countdown = await findCountdown(configuration);
  return R.ifElse(
    R.isNil || R.propEq('failure', true),
    () => notify(`Oh no! No countdown found for an event called ${
      event
    }! Try asking me for "list" to see your currently active countdowns.`)(configuration),
    R.pipe(
      buildMessageDetails,
      R.ifElse(
        isTodayOrPast,
        handlePastEvent(configuration),
        giveCountdown(configuration),
      )
    ),
  )(countdown)
}

const giveCountdown = (configuration) => R.pipe(
  generateCountdownMessage,
  message => notify(message)(configuration)
)

const handlePastEvent = (configuration) => R.ifElse(
  R.propEq('daysUntilEvent', 0),
  event => removeAndNotify(`Hooray! Today is the day for ${R.prop('event', event)}! You lucky dowgs, you.`, configuration),
  event => removeAndNotify(
    `Welp, looks like ${R.prop('event', event)} already happened! I'll remove that event for you.`, 
    configuration
  ),
);

const removeAndNotify = async (message, configuration) => {
    const deleted = await deleteCountdown(configuration);
    R.ifElse(
      isSuccessful,
      () => notify(message, configuration),
      () => notify('Hmmm...something went wrong, sorry!', configuration),
    )(deleted);
}

export const getCountdownScheduled = async (countdown, configuration) => R.pipe(
  buildMessageDetails,
  R.ifElse(
    isTodayOrPast,
    handlePastEvent(configuration),
    giveCountdown(configuration),
  )
)(countdown);

export default getCountdown;