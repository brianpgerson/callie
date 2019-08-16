import * as R from 'ramda';
import '@babel/polyfill';

import { notify } from '../services/message.service';
import findCountdowns from '../queries/findCountdowns';
import listCountdowns from '../lib/listCountdowns';
import moment from 'moment';

const TEST_EVENTS = [
  {event: 'Two', date: '2019-02-02'},
  {event: 'One', date: '2019-01-01'},
  {event: 'Four', date: '2019-04-04'},
  {event: 'Three', date: '2019-03-03'},
];

const EXPECTED = `Your events:\n 1: One _on_ ${moment('2019-01-01').calendar()}\n2: Two _on_ ${moment('2019-02-02').calendar()}\n3: Three _on_ ${moment('2019-03-03').calendar()}\n4: Four _on_ ${moment('2019-04-04').calendar()}`

jest.mock('../services/message.service')
notify.mockImplementation(jest.fn(message => context => {return message;}))
jest.mock('../queries/findCountdowns');
findCountdowns.mockResolvedValue(TEST_EVENTS);




describe('listCountdowns', () => {
  it('Events are sorted by date', async () => {
    const countdowns = await listCountdowns(TEST_EVENTS);
    expect(countdowns).toEqual(EXPECTED);
  });
});
