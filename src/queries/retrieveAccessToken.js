import findBot from '../queries/findBot';

const retrieveAccessToken = async (teamId) => {  
  try {
    const bot = await findBot({teamId});
    if (!bot) {
      console.error(`ERROR: no bot found somehow for a event from team ${event.team_id}`);
      return null;
    }
  
    return bot.botAccessToken;
  } catch (e) {
    console.error('e');
    return { failure: true, error: e };
  }
};

export default retrieveAccessToken;
