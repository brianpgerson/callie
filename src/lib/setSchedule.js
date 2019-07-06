/* use-strict */

import R from 'ramda';

import { notify } from '../services/message.service';
import { isSuccessful } from '../utils/general';
import updateCountdown from '../queries/updateCountdown';

import { DAY_STRING_TO_INT, DEFAULT_DAY, DEFAULT_HOUR } from '../constants/constants';

const isValidHour = R.both(R.lte(0), R.gt(24));

const getDayOfWeek = (configuration) => R.pipe(
  R.ifElse(
    R.pathEq(['settings', 'schedule'], 'daily'),
    R.always(null),
    R.pipe(
      R.pathOr(DEFAULT_DAY, ['settings', 'day']),
      R.toLower,
      R.prop(R.__, DAY_STRING_TO_INT),
      R.when(
        R.isNil,
        R.always({ error: `If you'd like to pick a day of the week, please set it like \`day: monday\`, for example` }),
      )
    )
  ),
)(configuration);

const getHour = (configuration) => R.pipe(
  R.pathOr(DEFAULT_HOUR, ['settings', 'hour']),
  num => parseInt(num, 10),
  R.unless(
    isValidHour, 
    R.always({ error: 'Hour setting is optional and set in military time PST, so 3pm would be `hour: 15`.' }),
  )
)(configuration);

const handleError = ({ channel, accessToken }, chronSettings) => R.pipe(
  R.values, 
  R.find(R.has('error')), 
  R.prop('error'), 
  errorMsg => notify(errorMsg)({channel, accessToken}),
)(chronSettings);

const setSchedule = async (configuration) =>  R.pipe(
  R.ifElse(
    R.hasPath(['settings', 'event']),
    updateChronSettings,
    notify('Please provide an event name')
  )
  )(configuration);

const createChronSettings = configuration => R.applySpec({
  channel: R.prop('channel'),
  rule: {
    dayOfWeek: getDayOfWeek,
    hour: getHour,
  }
})(configuration);

const hasError = R.pipe(R.values, R.any(R.has('error')));

const updateChronSettings = async (configuration) => {
  const chronSettings = createChronSettings(configuration);
  if (hasError(chronSettings)) {
    handleError(configuration, chronSettings);
    return;
  }
  
  const updated = await updateCountdown(configuration, R.objOf('schedule', chronSettings));
  R.ifElse(
    isSuccessful,
    () => notify(`I've updated your countdown reminder for ${configuration.settings.event}!`, configuration),
    ({ message }) => notify(message, configuration),
  )(updated);
}

export default setSchedule;