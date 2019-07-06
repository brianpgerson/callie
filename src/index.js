import '@babel/polyfill';

if (process.env.NODE_ENV === "test_env") {
	require('dotenv').config();
}

import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { createSlackEventAdapter } from '@slack/events-api';
import express from 'express';
import bluebird from 'bluebird';

import removeBot from './lib/removeBot';
import setupRoutes from './router';
import parser from './services/parser.service';
import initiateScheduler from './services/schedule.service';
import handleIntermediateActions from './services/countdown.service';

const testDb = process.env.TEST_DB;
const prodDb = process.env.PROD_DB;
const isTestEnv = process.env.NODE_ENV === 'test_env';
const port = process.env.PORT || 1337;
const databaseUrl = isTestEnv ? testDb : prodDb;
mongoose.Promise = bluebird;
mongoose.connect(databaseUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log(`Connected to DB in ${isTestEnv ? 'test mode' : 'live mode'}`));

const slackEvents = createSlackEventAdapter(
  process.env.SLACK_VERIFICATION_TOKEN, 
  { 
    includeBody: true,
    includeHeaders: true
  }
);

slackEvents.on('app_mention', async (event, body) => {
  try {
    const configuration = await parser(body);
    handleIntermediateActions(configuration);
  } catch (e) {
    console.error(`Error handling app message: ${e}`);
  }
});

slackEvents.on('error', console.error);

slackEvents.on('app_uninstalled', event => {
  console.log('Ready to delete bot! ', event);
  try {
    removeBot(event.team_id);
  } catch (e) {
    console.error(`error deleting bot: ${e}`)
  }
});

slackEvents.on('tokens_revoked', event => {
  console.log('Ready to delete bot! ', event);
  try {
    removeBot(event.team_id);
  } catch (e) {
    console.error(`error deleting bot: ${e}`)
  }
});

slackEvents.on('tokens_revoked', event => {
	try {
    removeBot(event.team_id);
  } catch (e) {
    console.error(`error deleting bot: ${e}`)
  }
});


const app = express();
app.use(bodyParser({limit: "15MB"}));
app.use('/slack/events', slackEvents.expressMiddleware());
setupRoutes(app);
app.listen(port, () => console.log(`Server listening on port ${port}`));
setTimeout(() => initiateScheduler(), 1000);

