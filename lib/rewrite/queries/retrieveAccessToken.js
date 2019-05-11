import Bot from '../../models/bot';

const retrieveAccessToken = async (teamId) => {
  const bot = await Bot.findOne({teamId: teamId});
  if (!bot) {
    console.error(`ERROR: no bot found somehow for a event from team ${event.team_id}`);
    return null;
  }

  return bot.botAccessToken;
};

export default retrieveAccessToken;
