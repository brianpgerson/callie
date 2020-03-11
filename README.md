# Callie the Calendar Corgi

Callie is a slackbot that counts down the days to a given event. The way she works is extremely simple, and I've tried to support a variety of countdown-related functions. Everything is pretty much outta the box. I was surprised that there wasn't already a good countdown bot, but whatever.

Callie was originally written as a custom integration to be used by my friends and I. I extended her functionality and made her publicly available because I thought it would be fun. It is fun! But she is far from perfect, so please open up issues as they arise, and feel _very_ free to contribute.

## TODOs

- [ ] Refactor message parsing to allow greater flexibility in commands
- [ ] Figure out why Callie's initial welcome message doesn't always send (likely a channel permission issue)
- [ ] Allow for time-based countdowns (i.e., set the event time as well as date)
- [ ] ...
- [ ] Profit

## Install OOTB
* Just visit [the landing page](https://callie-corgi.herokuapp.com) and click "add to slack".

## Contribute

1. fork this repo
2. Set up your local environment

``` 
git clone <your forked repo>
cd <app directory>
heroku login
heroku create test-callie
```
3. Make changes to code
4. Setup a [development app](https://api.slack.com/apps?new_app=1) on Slack to test
4. Add the following environment variables to [heroku](https://dashboard.heroku.com/)
5. Push to your heroku test app and test
```
git push heroku
```
6. Issue a pull request from your fork back to the parent repository