import Countdown from '../models/countdown';

const deleteCountdown = async (configuration) => {
  const { teamId, settings: { event }} = configuration;
  try {
    const results = await Countdown.findOneAndRemove({ teamId, event });

    
    return results === null ? 
      {failure: true, message: `No countdown found for an event called ${event}!`} : 
      { success: true }; 
  } catch (e) {
    console.error(e);
    return { failure: true, message: 'There was a problem removing this countdown, sorry!' };
  }
}

export default deleteCountdown;
