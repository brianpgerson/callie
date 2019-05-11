import Countdown from '../../models/countdown';

const updateCountdown = async (configuration, updates) => {
  const { teamId, settings: { event }} = configuration;

  try {
    const modifiedCountdown = await Countdown.findOneAndUpdate(
      { teamId, event }, 
      updates, 
      {runValidators: true, new: true}
    );
    
    return modifiedCountdown ? SUCCESS : FAILURE;
  } catch (e) {
    console.error(e);
    return FAILURE;
  }
}

const SUCCESS = { success: true };
const FAILURE = { failure: true, message: 'Something went wrong with updating that countdown, sorry! Did you get the name of the event right?' };
export default updateCountdown;
