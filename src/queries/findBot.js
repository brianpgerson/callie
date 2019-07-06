import Bot from '../models/bot';

const findBot = async ({ teamId }) => Bot.findOne({ teamId });

export default findBot;
