 const MESSAGE_TYPES = {
  HELP: 'help',
  RESET: 'reset',
  SCHEDULE: 'schedule',
  START: 'start',
  CANCEL: 'cancel',
  LIST: 'list',
  COUNTDOWN: 'countdown',
  DELETE: 'delete',
  UNKNOWN: 'unknown',
};

 const CHANNEL_SIGNIFIERS = ['G', 'C', 'D'];

 const ALLOWED_FIELDS = ['date', 'token', 'teamId', 'event', 'destination', 'schedule', 'day', 'hour', 'countdown'];