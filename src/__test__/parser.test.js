import * as R from 'ramda';
import '@babel/polyfill';

import retrieveAccessToken from '../queries/retrieveAccessToken';
import parseMessage from '../services/parser.service';

const ACCESS_TOKEN = 'ZZZZZZWSxiZZZ2yIvs3peJ';
const TEAM_ID = 'T061EG9R6';

jest.mock('../queries/retrieveAccessToken');
retrieveAccessToken.mockResolvedValue(ACCESS_TOKEN);

const TEST_MESSAGE = {
  token: ACCESS_TOKEN,
  team_id: TEAM_ID,
  api_app_id: 'A0MDYCDME',
  event:
  { type: 'app_mention',
    user: 'U061F7AUR',
    ts: '1515449522.000016',
    channel: 'C0LAN2Q65',
    event_ts: '1515449522000016' },
  type: 'event_callback',
  event_id: 'Ev0LAN670R',
  event_time: 1515449522000016,
  authed_users: [ 'U0LAN0Z89' ] 
};

const getMessage = (text) => R.assocPath(['event', 'text'], text, TEST_MESSAGE);

const getExpected = (settings, type, text) => ({ 
  channel: 'C0LAN2Q65',
  message: text,
  type: type,
  teamId: TEAM_ID,
  accessToken: ACCESS_TOKEN,
  settings: settings
});

describe('parseMessage', () => {
  it('parses a start message', async () => {
    const text = '<@U0LAN0Z89> start date: someday, event: funtown'
    const startMessage = getMessage(text);
    const configuration = await parseMessage(startMessage);
    
    expect(configuration).toMatchObject(getExpected({ date: 'someday', event: 'funtown' }, 'start', text));
  });

  it('parses a list message', async () => {
    const text = '<@U0LAN0Z89> list'
    const startMessage = getMessage(text);
    const configuration = await parseMessage(startMessage);
    expect(configuration).toMatchObject(getExpected({}, 'list', text));
  });

  it('parses a delete message', async () => {
    const text = '<@U0LAN0Z89> delete event: funtown'
    const startMessage = getMessage(text);
    const configuration = await parseMessage(startMessage);
    expect(configuration).toMatchObject(getExpected({ event: 'funtown' }, 'delete', text));
  });

  it('parses a schedule message', async () => {
    const text = '<@U0LAN0Z89> schedule event: funtown, day: sunday, hour: 11'
    const startMessage = getMessage(text);
    const configuration = await parseMessage(startMessage);  
    expect(configuration).toMatchObject(getExpected({ event: 'funtown', day: 'sunday', hour: '11' }, 'schedule', text));
  });

  it('parses a countdown message', async () => {
    const text = '<@U0LAN0Z89> countdown event: funtown'
    const startMessage = getMessage(text);
    const configuration = await parseMessage(startMessage);      
    expect(configuration).toMatchObject(getExpected({ event: 'funtown' }, 'countdown', text));
  });
});