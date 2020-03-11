export const MESSAGE_TYPES = {
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

export const CHANNEL_SIGNIFIERS = ['G', 'C', 'D'];
export const CALLIE = process.env.CALLIE;
export const ALLOWED_FIELDS = ['date', 'token', 'teamId', 'event', 'destination', 'schedule', 'day', 'hour', 'countdown', 'workdays'];

export const DAY_STRING_TO_INT = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0
}
export const DEFAULT_DAY = 'monday';
export const DEFAULT_HOUR = 10;

export const STANDARD_PREFIXES = [
  'Grrrrr... er, glad you asked! There are ',
  'Let me check the schedule. Ah, yes: There remain ',
  'How exciting! There are only ',
  'Well, if you must know...BARK! There are precisely ',
  'Arf! As far as I can tell, there remain ',
  'Woof woof woof. Oh, I mean, there are ',
  'My pleasure! There are ',
]

export const CLOSE_PREFIXES = [
  `Oh boy oh boy oh boy, only `,
  `Wow, it's getting really close! ARF! Just `,
  `Time's really flyin' by - just `,
  `<tail wags> <more tail wags> Only `,
  `Hoooo boy, just `,
  `RrrrrWOOF! The countdown is... `,		
  `Buckle up, team...only `
];

export const DOG_SOUNDS = [/arf/, /bark/, /woof/, /ruff/, /grrr/];
export const DOG_COMMANDS = [/sit/, /stay/, /speak/, /roll over/, /shake/];
export const CONFUSED_RESPONSES = [
  `Sorry, didn\'t quite catch that. Try again, or ask for "help". Woof woof.`,
  `Hmmm... <wags tail> <tilts head in confusion> Ask for "help" if you're confused too!`,
  `That doesn\'t seem right. Do you need help? Just ask for it!`,
  `I just don't know what you're getting at with that. You messin' with me? Just cause I'm a cute lil corgi?`,
  `Hmmm, try something else. That didn't seem to match any of my expectations. Ask for "help" if you need it!`,
  `Arf! I am confused by your request. I am very smart for a corgi, but I am still a corgi, after all. Ask for "help" if you need it!`
];