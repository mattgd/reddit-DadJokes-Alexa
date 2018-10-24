'use strict';

const Alexa = require('ask-sdk-core');
const snoowrap = require('snoowrap');
const reddit = new snoowrap({
  userAgent: 'App for /r/dadjokes Alexa skill.',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN
});

const DAD_JOKES_SUBREDDIT = 'dadjokes'
const SKILL_NAME = 'Reddit Dad Jokes';

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a Promise which resolves as a joke from the r/dadjokes subreddit.
 */
function getJoke() {
  return new Promise(resolve => {
    reddit.getSubreddit(DAD_JOKES_SUBREDDIT).getHot().then((listing) => {
      const submissionIdx = getRandomInt(0, listing.length);
      const submission = listing[submissionIdx];
      var title = submission.title.trim();
      if (!/[.!?,;:]$/.test(title)) {
        title += '.';
      }

      const joke = `${title} ${submission.selftext.trim()}`;
      resolve(joke);
    });
  });
};

// Core functionality for Dad Jokes skill
const GetJokeHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    // Checks request type
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetJokeIntent');
  },
  async handle(handlerInput) {
    const joke = await getJoke();

    return handlerInput.responseBuilder
      .speak(joke)
      .withSimpleCard(SKILL_NAME, joke)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
           request.intent.name === 'AMAZON.HelpHandler';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('To hear a joke, ask reddit Dad Jokes for a joke.')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);

    const errorJoke = 'I applied to be a server years ago. To this day, I\'m still waiting.';
    return handlerInput.responseBuilder
      .speak(errorJoke)
      .reprompt(errorJoke)
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetJokeHandler,
    HelpHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();