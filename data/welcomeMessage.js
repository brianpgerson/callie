module.exports = `I'm a friendly countdown bot, and I'm a simple way to keep a running countdown to an event you and your team are excited about!

A countdown just needs a date, an event name, and an optional destination.

To start your countdown, simply say:

\`@thecount start date: <the date, formatted YYYY-MM-DD>, destination: <your destination (optional)>, event: <your event name>\`

I'll let you know if you got it right! To reset with a new date or destination, just use the same command with \`reset\` instead of \`start\`.

You can then ask for the countdown by simply calling my name with the event name: \`@thecount <event name>\`.

I also give weekly or daily countdown reminders. You can set those by saying:

\`@thecount schedule: <weekly or daily>, day: <day of week>, hour: <hour in military time>\`

If you set it for daily, simply ignore the day setting, like so:

\`@thecount schedule: daily, hour: <hour in military time>\`

Hour is optional as well, and will default to 10am (Pacific).

You can cancel automated reminders for an event by saying:

\`@thecount cancel event: <event name>\`

(Resetting the event will start your automated reminders again, BTW)

Lastly, you can delete a countdown entirely by, you guessed it:

\`@thecount delete event: <event name>\`

To see this message again, simply say "@thecount help".

You can find more information (or contribute to The Count) at www.github.com/brianpgerson/the-count

See ya!`
