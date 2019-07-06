import R from 'ramda';
import nodeSchedule from 'node-schedule';
import Countdown from '../models/countdown';
import { getCountdownScheduled } from '../lib/getCountdown';

const initiateScheduler = () => {
  const rule = new nodeSchedule.RecurrenceRule();
  rule.second = 0;
  rule.minute = 0;

  const scheduler = nodeSchedule.scheduleJob(rule, () => {
    const date = new Date();
    const currentHour = date.getHours();
    const currentDay = date.getDay();
    const query = {
      "$or": [
          { 'schedule.rule.hour': currentHour, 'schedule.rule.dayOfWeek': null },
          { 'schedule.rule.hour': currentHour, 'schedule.rule.dayOfWeek': currentDay }
        ]
      };

    Countdown.find(query).then(R.forEach(executeReminder));
  });
}

const executeReminder = (countdown) => {
  const { event, teamId, botAccessToken, schedule: { channel } = {} } = countdown;
  
  const configuration = { 
    teamId,
    channel,
    accessToken: botAccessToken,
    settings: {
      event,
    }
  };

  getCountdownScheduled(countdown, configuration);
}

export default initiateScheduler;