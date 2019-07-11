import R from 'ramda';
import Countdown from '../models/countdown';

const findCountdown = async (configuration) => {
  const { teamId, settings: { event }} = configuration;
  
  try {
    return await Countdown.findOne({ teamId, event });
  } catch (e) {
    console.error(e);
    return { failure: true, error: e };
  }
}

export default findCountdown;
