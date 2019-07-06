import Countdown from '../models/countdown';

const findCountdown = async (configuration) => {
  const { teamId } = configuration;
  try {
    return await Countdown.find({ teamId });
  } catch (e) {
    console.error(e);
    return { failure: true, error: e };
  }
}

export default findCountdown;
