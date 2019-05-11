import R from 'ramda';
import { CHANNEL_SIGNIFIERS, MESSAGE_TYPES, ALLOWED_FIELDS } from './constants';
import retrieveAccessToken from './queries/retrieveAccessToken.js';

const isInChannel = R.pipe(
  R.head,
  R.includes(R.__, CHANNEL_SIGNIFIERS)
)

const getEventMessage = R.path(['event', 'text']);

const extractType = R.pipe(
  getEventMessage,
  R.split(' '),
  R.nth(1),
  R.toUpper,
  R.propOr(MESSAGE_TYPES.UNKNOWN, R.__, MESSAGE_TYPES),
)
const isValidMessage = (messageEvent) => R.allPass([isChannelMessage, hasTeamId])(messageEvent);

const isChannelMessage = (messageEvent) => R.pipe(
  R.path(['event', 'channel']),
  R.allPass([R.is(String), isInChannel]),
)(messageEvent);

const hasTeamId = R.has('team_id');
const getTeamId = R.prop('team_id');
const getChannel = R.path(['event', 'channel']);

const getAccessToken = async (messageEvent) => R.pipe(
  getTeamId,
  await retrieveAccessToken,
)(messageEvent);

const createBaseConfiguration = async (messageEvent) =>
  R.applySpec({
    channel: getChannel,
    message: getEventMessage,
    type: extractType,
    teamId: getTeamId,
    accessToken: await getAccessToken,
  })(messageEvent);


const isNonAction = R.pipe(
  R.prop('type'),
  R.includes(R.__, [MESSAGE_TYPES.HELP, MESSAGE_TYPES.LIST])
);

const handleValidMessage = async (messageEvent) => R.pipe(
  await createBaseConfiguration,
  R.unless(isNonAction, addUserInputs),
)(messageEvent);

const parseMessage = async (messageEvent) => 
  R.when(
  isValidMessage,
  await handleValidMessage,
  (thing) => console.log(thing)
)(messageEvent);

const addUserInputs = (configuration) => R.assoc('settings', parseSettings(configuration), configuration);

const parseSettings = configuration => R.pipe(
  R.prop('message'),
  R.toLower,
  text => getSettingsAfterType(text, configuration)
)(configuration);

const sanitizeLinks = (settingValue) => R.ifElse(
  R.test(/<http/),
  R.pipe(
    R.drop(8),
    R.dropLast(1),
    R.split('|'),
    R.head,
  ),
  R.always(settingValue)
)(settingValue);

const getSettingsAfterType = (text, { type }) => R.pipe(
    R.indexOf(type),
    idx => R.sum([idx, R.length(type)]),
    R.drop(R.__, text),
    R.trim,
    R.split(','),
    R.map(R.pipe(R.split(':'), R.map(R.trim))),
    R.reduce((settings, pair) => R.assoc(pair[0], sanitizeLinks(pair[1]), settings), {}),
    R.pick(ALLOWED_FIELDS)
  )(text);

test = {
  "token": "ZZZZZZWSxiZZZ2yIvs3peJ",
  "team_id": "T061EG9R6",
  "api_app_id": "A0MDYCDME",
  "event": {
      "type": "app_mention",
      "user": "U061F7AUR",
      "text": "<@U0LAN0Z89> start date: someday, event: funtown",
      "ts": "1515449522.000016",
      "channel": "C0LAN2Q65",
      "event_ts": "1515449522000016"
  },
  "type": "event_callback",
  "event_id": "Ev0LAN670R",
  "event_time": 1515449522000016,
  "authed_users": [
      "U0LAN0Z89"
  ]
}