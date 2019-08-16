/* use-strict */

import R from 'ramda';
import moment from 'moment';
import { notify } from '../services/message.service';

import findCountdowns from '../queries/findCountdowns';
import { mapIndexed } from '../utils/general';

const formatAndNotify = configuration => countdowns => R.pipe(
  R.ifElse(
    R.isEmpty,
    R.always(`You haven't listed any events yet! Ask for 'help' if you're having a ...ruff time!`),
    R.pipe(
      sortEventsByDate,
      mapIndexed(({event, date}, idx) => `${idx + 1}: ${event} _on_ ${moment(date).calendar()}`),
      R.join('\n'),
      events => `Your events:\n ${events}`,
    )
  ),
  message => notify(message)(configuration)
)(countdowns)

const sortEventsByDate = (events) => R.sort((e0, e1) => moment(e0.date).isBefore(e1.date) ? -1 : (moment(e0.date).isSame(e1.date) ? 0 : 1), events)


const listTeamEvents = async (configuration) => {
  const countdowns = await findCountdowns(configuration);
  
  return R.ifElse(
    Array.isArray,
    formatAndNotify(configuration),
    ({ message }) => notify(message)(configuration),
  )(countdowns);
};
      
export default listTeamEvents
