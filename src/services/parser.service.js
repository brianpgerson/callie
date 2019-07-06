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
  async id => await retrieveAccessToken(id),
)(messageEvent);

const createBaseConfiguration = async (messageEvent) => {
  const token = await getAccessToken(messageEvent);
  return R.applySpec({
    channel: getChannel,
    message: getEventMessage,
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

const handleValidMessage = async (messageEvent) => {
  const config = await createBaseConfiguration(messageEvent);
  return isNonAction(config) ? config : addUserInputs(config);  
}

const parseMessage = async (messageEvent) => 
  R.when(
  isValidMessage,
  handleValidMessage,
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
    R.unless(
      () => R.equals(MESSAGE_TYPES.SCHEDULE, type),
      idx => R.sum([idx, R.length(type)]),
    ),
    R.drop(R.__, text),
    R.trim,
    R.split(','),
    R.map(R.pipe(R.split(':'), R.map(R.trim))),
    R.reduce((settings, pair) => R.assoc(pair[0], sanitizeLinks(pair[1]), settings), {}),
    R.pick(ALLOWED_FIELDS)
  )(text);

export default parseMessage;