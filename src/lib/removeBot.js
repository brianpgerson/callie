/* use-strict */

import R from 'ramda';

import deleteBot from '../queries/deleteBot';
import { isSuccessful } from '../utils/general';

const removeBot = (teamId) => 
  R.pipe(
    deleteBot,
    R.ifElse(
      isSuccessful,
      () => console.log(`Deleted bot for ${teamId}`),
      () => console.error(`failed to delete bot for ${teamId}!`),
    )
  )(teamId)

export default removeBot;