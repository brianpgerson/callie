import Countdown from '../../models/countdown';

const findCountdown = async (configuration) => {
  const { teamId, settings: { event }} = configuration;
  return await Countdown.findOne({ teamId, event });
}

export default findCountdown;
