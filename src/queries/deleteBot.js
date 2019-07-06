import Bot from '../models/bot';

const deleteBot = async (teamId) => {
  try {
    await Bot.findOneAndRemove({ teamId });
  } catch (e) {
    console.error(e);
    return { failure: true, message: `There was a problem deleting a bot for ${teamId}`};
  }
}

export default deleteBot;
