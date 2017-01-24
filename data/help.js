module.exports = `Hi, I'm Callie - I'm a simple way to keep a running countdown to an event you and your team are excited about.

Any countdown just needs a date, an event name, and an optional destination.

To start your countdown, simply say:

\`@callie start date: <the date, formatted YYYY-MM-DD>, destination: <your destination (optional)>, event: <your event name>\`

I'll let you know if you got it right! To reset the same countdown with a new date or destination, just use the same command with \`reset\` instead of \`start\`.

You can then ask for the countdown like so: \`@callie countdown: <event name>\`.

I also give weekly or daily countdown reminders. You can set those by saying:

\`@callie schedule: <weekly or daily>, day: <day of week>, hour: <hour in military time>\`

If you set it for daily, simply ignore the day setting, like so:

\`@callie schedule: daily, hour: <hour in military time>\`

Hour is optional as well, and will default to 10am (Pacific).

You can cancel automated reminders for an event by saying:

\`@callie cancel event: <event name>\`

If you reset the event, I'll start your automated reminders again. Arf!

Lastly, you can delete a countdown entirely by, you guessed it:

\`@callie delete event: <event name>\`

To see this message again, simply say "@callie help".

See ya!`
