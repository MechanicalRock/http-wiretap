import { defineFeature, loadFeature } from "jest-cucumber"

// NOTE: probably need to factor in cold starts especially when running behind vpc

const feature = loadFeature("cucumber/features/proxying.feature")
const proxyUrl = "elb-dns-name-fill-me-in"

defineFeature(feature, scenario => {

  scenario('The downstream service fails to respond', ({ given, and, when, then }) => {
    given('the downstream service shall not respond', () => {
      // send url to correct api gateway endpoint
    });

    and(/^the proxy timeout is configured to (.*) second$/, (proxyTimeoutSecs: string) => {
      // use aws sdk to set timeout for proxy (need lambda arn)
    });

    when('the client send a request to the proxy', () => {
      // use fetch to send get request
    });

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      // check response code
    });

    and(/^the proxy should return within (.*) seconds$/, (elapsedTime: string) => {
      // check timer
    });
  });

  scenario('Transparent proxying of requests downstream', ({ when, then, and }) => {
    when('the client send a request to the proxy', async () => {
       // send url to correct api gateway endpoint
       // use fetch to post to the endpoint
    });

    then('the request body should be received by the downstream service', () => {
    });

    and('the request headers should be received by the downstream service', () => {
    });

    and('the request parameters should be received by the downstream service', () => {
    });

    and('the request path should be received by the downstream service', () => {
    });
  });

  scenario('Response bodies are returned upstream', ({ given, when, then, and }) => {
    given('the downstream service shall respond with a response body', () => {
      // send url to correct api gateway endpoint
    });

    when('the client sends a request to the proxy', async () => {
      // use fetch to post to the endpoint
    });

    then('the client should receive the response body from the downstream service', () => {
      // check response body
    });

    and('the client should receive the response headers from the downstream service', () => {
      // check response header
    });
  });

  scenario('Responses are returned from downstream', ({ given, when, then }) => {
    given(/^the downstream service shall return (\d+)$/, async (statusCode: string) => {
      // set url to correct api gateway endpoint
    });

    when(/^the client sends (.*) a request to the proxy$/, (method: string) => {
      // use fetch to call endpoint with method
    });

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      // check response
    });
  });

})
