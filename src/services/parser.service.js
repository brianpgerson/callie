import R from 'ramda';

import { CHANNEL_SIGNIFIERS, MESSAGE_TYPES, ALLOWED_FIELDS } from '../constants/constants';
import retrieveAccessToken from '../queries/retrieveAccessToken';

const isInChannel = R.pipe(
  R.head,
  R.includes(R.__, CHANNEL_SIGNIFIERS)
)

const getEventMessage = R.path(['event', 'text']);

const extractType = R.pipe(
    getEventMessage,
    R.split(' '),
    R.nth(1),
    R.split(':'),
    R.head,
    R.toUpper,
    R.propOr(MESSAGE_TYPES.UNKNOWN, R.__, MESSAGE_TYPES),
  );

// Used in parseMessage
const isValidMessage = (messageEvent) => R.allPass([isChannelMessage, hasTeamId])(messageEvent);

// Used in isValidMessage
const isChannelMessage = (messageEvent) => R.pipe(
  R.path(['event', 'channel']),
  R.allPass([R.is(String), isInChannel]),
)(messageEvent);

// Used in isValidMessage
const hasTeamId = R.has('team_id');
// Used in getAccessToken
const getTeamId = R.prop('team_id');
// Used in createBaseConfiguration
const getChannel = R.path(['event', 'channel']);

// Used in createBaseConfiguration
const getAccessToken = async (messageEvent) => R.pipe(
  getTeamId,
  async id => await retrieveAccessToken(id),
)(messageEvent);

// Used in main pipeline from handleValidMessage
const createBaseConfiguration = async (messageEvent) => {
  console.log(messageEvent);
  const token = await getAccessToken(messageEvent);
  return R.applySpec({
    channel: getChannel,
    message: getEventMessage,
    // TODO: get workingdays boolean from message string
    type: extractType,
    teamId: getTeamId,
    settings: R.always({}),
    accessToken: R.always(token),
  })(messageEvent);
}


const isNonAction = R.pipe(
  R.prop('type'),
  R.includes(R.__, [MESSAGE_TYPES.HELP, MESSAGE_TYPES.LIST]),
);

// Used in parseMessage
const handleValidMessage = async (messageEvent) => {
  const config = await createBaseConfiguration(messageEvent);
  return isNonAction(config) ? config : addUserInputs(config);  
}

// Parsing Pipeline starts here
const parseMessage = async (messageEvent) => 
  R.when(
  isValidMessage,
  handleValidMessage,
)(messageEvent);

const addUserInputs = (configuration) => R.assoc('settings', parseSettings(configuration), configuration);

const parseSettings = configuration => R.pipe(
  R.prop('message'),
  text => getSettingsAfterType(text, configuration),
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

const isType = (toCheck, type) => R.equals(toCheck, R.toLower(type))

const handleCountdown = (type) => (text) => R.pipe(
  R.split(R.toLower(type)),
  R.ifElse(
    R.pipe(R.last, R.match(/event:/), R.isEmpty),
    R.join('countdown event'),
    R.join('countdown'),
  ),
)(text)

const getSettingsAfterType = (text, { type }) => {
  const transformedText = R.when(
    () => isType(MESSAGE_TYPES.COUNTDOWN, type),
    handleCountdown(type),
  )(text);

  const cleanedText = R.pipe(
    R.indexOf(type),
    R.unless(
      () => isType(MESSAGE_TYPES.SCHEDULE, type),
      idx => R.sum([idx, R.length(type)]),
    ),
    R.drop(R.__, transformedText),
    R.trim,
  )(transformedText);

  return R.pipe(
    R.split(','),
    R.map(R.pipe(R.split(':'), R.map(R.trim))),
    R.reduce((settings, pair) => R.assoc(pair[0], sanitizeLinks(pair[1]), settings), {}),
    R.toPairs,
    R.map(([key, val]) => [R.toLower(key), val]),
    R.fromPairs,
    R.pick(ALLOWED_FIELDS),
  )(cleanedText)
};

export default parseMessage;