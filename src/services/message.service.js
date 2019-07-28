import * as R from 'ramda';
import request from 'request';

import { pickRandom } from '../utils/general';

import {
  STANDARD_PREFIXES,
  CLOSE_PREFIXES,
  CALLIE,
  DOG_SOUNDS,
  DOG_COMMANDS,
  CONFUSED_RESPONSES,
} from '../constants/constants';

export const notify = R.curry((message, { channel, accessToken }) => {
  postMessage(channel, message, { token: accessToken })
});
const createPrefixStandard = (randoPrefix) => R.pipe(
  R.prop('daysUntilEvent'),
  String,
  R.concat(R.__, ' days until '),
  R.concat(randoPrefix)
)

const createPrefixClose = (randoPrefix) => R.pipe(
  R.prop('daysUntilEvent'),
  String,
  days => R.concat(days, ` ${days === '1' ? 'day' : 'days'} until `),
  R.concat(randoPrefix)
)

const addDestination = ({ destination }) => R.concat(
  R.__, `you head to ${destination} for `
)

const addEvent = ({ event }) => R.concat(R.__, event);

export const generateCountdownMessage = messageDetails => R.pipe(
  R.ifElse(
    R.propSatisfies(R.gt(10), 'daysUntilEvent'),
    createPrefixStandard(pickRandom(STANDARD_PREFIXES)),
    createPrefixClose(pickRandom(CLOSE_PREFIXES)),
  ),
  R.unless(
    () => R.propSatisfies(R.isNil, 'destination', messageDetails),
    addDestination(messageDetails),
  ),
  addEvent(messageDetails)
)(messageDetails);

export const generateRandomReply = (configuration) => R.pipe(
  R.prop('message'),
  R.cond([
    [isSilly(DOG_COMMANDS), getDogCommand(DOG_COMMANDS)],
    [isSilly(DOG_SOUNDS), () => `${pickRandom(DOG_SOUNDS).source}!`],
    [R.T, () => pickRandom(CONFUSED_RESPONSES)],
  ]),
  response => notify(response)(configuration)
)(configuration);

const getDogCommand = (commands) => (message) => R.pipe(
  R.find(command => R.test(command, message)),
  command => `Dangit, I never learned how to ${command.source}. I only know how to count, read, write, and bark, embarrassingly enough.`
)(commands);

const isSilly = phrases => message => R.any(tester => R.test(tester, message))(phrases);

export const postMessage = (channelId, text, params) => {
  params = Object.assign({
    text: text,
    channel: channelId,
    username: CALLIE
  }, params);

  return _api('chat.postMessage', params);
}

const _preprocessParams = (params) => {
  Object.keys(params).forEach((name) => {
    let param = params[name];

    if (param && typeof param === 'object') {
      params[name] = JSON.stringify(param);
    }
  });

  params.as_user = CALLIE;
  return params;
}

const _api = (methodName, params) => {
  const data = {
    url: `https://slack.com/api/${methodName}`,
    form: _preprocessParams(params)
  };
      
  return new Promise((resolve, reject) => {
    request.post(data, (err, _, body) => {
      if (err) {
        reject(err);
        console.error(`err: ${JSON.stringify(err)}`);
        return false;
      }

      try {
        body = JSON.parse(body);

        // Response always contain a top-level boolean property ok,
        // indicating success or failure
        if (body.ok) {
          resolve(body);
        } else {
          reject(body);
          console.error(`rejected slack post! body: ${JSON.stringify(body)}`);
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}
