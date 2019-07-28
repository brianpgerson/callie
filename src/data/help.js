module.exports = `Happy to help!

Any countdown just needs a date, an event name, and an optional destination.

To start your countdown, simply say:

\`@callie start date: <the date, formatted YYYY-MM-DD>, destination: <your destination (optional)>, event: <your event name>\`

*Keep in mind that you don't actually need to type the "<" and ">" symbols. That's just how I let you know that those are your own inputs!*

I'll let you know if you got it right! To reset the same countdown with a new date or destination, just use the same command with \`reset\` instead of \`start\`.

You can then ask for the countdown like so: \`@callie countdown: <event name>\` or \`@callie countdown event: <event name>\`. If you'd like to see all of your countdowns, just say \`@callie list\`.

I also give weekly or daily countdown reminders. You can set those by saying:

\`@callie schedule: <weekly or daily>, day: <day of week>, event: <event name>, hour: <hour in military time>\`

If you set it for daily, simply ignore the day setting, like so:

\`@callie schedule: daily, event: <event name>, hour: <hour in military time>\`

Hour is optional as well, and will default to 10am (Pacific).

You can cancel automated reminders for an event by saying:

\`@callie cancel event: <event name>\`

If you reset the event, I'll start your automated reminders again. Arf!

Lastly, you can delete a countdown entirely by, you guessed it:

\`@callie delete event: <event name>\`

To see this message again, simply say "@callie help".

See ya!`
