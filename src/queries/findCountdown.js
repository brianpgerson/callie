import Countdown from '../models/countdown';

const findCountdown = async (configuration) => {
  const { teamId, settings: { event }} = configuration;
  console.log('FINDING COUNTDOWN', configuration);
  
  try {
    const countdown = await Countdown.findOne({ teamId, event });
    console.log(countdown);
    return countdown;
  } catch (e) {
    console.error(e);
    return { failure: true, error: e };
  }
}

export default findCountdown;
