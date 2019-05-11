import Countdown from '../../models/countdown';

const saveCountdown = async (configuration) => {
  const { 
    teamId, 
    channel, 
    accessToken, 
    settings: { event, destination, date }
  } = configuration;

  const newCountdown = new Countdown({
    event,
    destination,
    date,
    teamId,
    channels: [	channel ],
    botAccessToken: accessToken,
    schedule: {
      id: teamId + event.split(' ').join('_'),
      rule: {hour: 10, dayOfWeek: 1},
      channel
    }
  });

  try {
    const savedCountdown = await newCountdown.save();
    console.log('saved new countdown!', savedCountdown);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { failure: true };
  }
}

export default saveCountdown;
