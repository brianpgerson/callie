# The Count

The Count is a slackbot that counts down the days to a given event. The way he works is extremely simple, but you'll have to configure things like the event name, date, and destination yourself. Everything is pretty much outta the box. I was surprised that there wasn't already a good countdown bot, but whatever. Enjoy.

## Setup

* Add the bot to your slack group (https://YOURGROUP.slack.com/services/new/bot) and set the resulting API key to your environment vars
* Replace the event date and name with your own event date and name in the code, or just use @thecount's update functionality.
* The defaults are for a mystery trip in March. That's because my countdown is for a mystery trip and I don't want to reset it every time I update, so you'll just have to do that instead unless you update the code. I just select a random city for fun because my friends can't know the actual destination. Do whatever you want instead of using the cities module.

## Running
* IDK, deploy to heroku or something. Or just run it locally with `node bin/bot.js`. But heroku is prob easier to keep running forever

## Next steps

* Implement a database so the count can keep track of multiple events. Feel free to contribute.
