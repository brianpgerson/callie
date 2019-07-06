import R from 'ramda';
import SlackNode from 'slack-node';
import express from 'express';
import path from 'path';
import Bot from './models/bot';
import findBot from './queries/findBot';
import deleteBot from './queries/deleteBot';
import presets from './data/presets';
import { notify } from './services/message.service';

const slack = new SlackNode();	
const getParams = (code) => ({
  client_id: process.env.SLACK_CLIENT,
  client_secret: process.env.SLACK_SECRET,
  code
});

export const handleSignup = async (req, res) => {
	let code = R.path(['query', 'code'], req);
	slack.api('oauth.access', getParams(code), async (err, response) => {
		if (!!err || !response.bot) {
			console.error(err);
			res.status(500).sendFile(path.join(__dirname + '/../public/error.html'));
		} else {
      const { 
        bot: { bot_access_token: botAccessToken, bot_user_id: botId }, 
        team_id: teamId,
        team_name: teamName,
      } = response;
  
      try {
        const dupeBot = await findBot({teamId});
        if (dupeBot) {
          console.error('bot already exists for team', teamId);
          const deleted = await deleteBot(teamId);
          if (deleted === null) {
            res.sendFile(path.join(__dirname + '/../public/oops.html'));
            return;
          }
        } 
          
        const newBot = new Bot({ botAccessToken, userId: botId, teamId, teamName });
        await newBot.save();

        const channel = R.path(['incoming_webhook', 'channel_id'], response);
        if (channel) {
          notify(presets.hello, { channel, accessToken: botAccessToken });
        }
        res.sendFile(path.join(__dirname + '/../public/success.html'));
      } catch (e) {
        console.error(`error saving new bot: ${e}`);
        res.status(500).sendFile(path.join(__dirname + '/../public/error.html'));
      }
		} 
	}); 
}


const setupRoutes = (app) => {
	app.use("/", express.static(__dirname + '/../public/'));
	app.get('/success', (req, res) => handleSignup(req, res));
	app.use('/*', (req, res) => {
		res.status(500).sendFile(path.join(__dirname + '/../public/error.html'));
	});
};

export default setupRoutes;