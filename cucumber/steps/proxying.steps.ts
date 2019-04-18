import { defineFeature, loadFeature } from "jest-cucumber"
// import fetch, { Response } from "node-fetch"

const feature = loadFeature("cucumber/features/proxying.feature")
// const proxyUrl = ""

defineFeature(feature, scenario => {
  scenario('The downstream service fails to respond', ({ given, and, when, then }) => {
    given('the downstream service shall not respond', () => {

    });

    and(/^the proxy timeout is configured to (.*) second$/, (arg0) => {

    });

    when('the client send a request to the proxy', () => {

    });

    then(/^the proxy return code should be (.*)$/, (arg0) => {

    });

    and(/^the proxy should return within (.*) seconds$/, (arg0) => {

    });
  });

  scenario('Transparent proxying of requests downstream', ({ when, then, and }) => {
    when('the client send a request to the proxy', () => {

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

  scenario('Proxying downstream path URL', ({ given, when, then }) => {
    given(/^the downstream service URL is configured as (.*)$/, (arg0) => {

    });

    when('the request path "/foo/bar/baz?something=awesome" is sent to the proxy', (arg0) => {

    });

    then('the downstream service should receive the path "/mypath/foo/bar/baz?something=awesome"', (arg0) => {

    });
  });

  scenario('Response bodies are returned upstream', ({ given, when, then, and }) => {
    given('the downstream service shall respond with a response body', () => {

    });

    when('the client sends a request to the proxy', () => {

    });

    then('the client should receive the response body from the downstream service', () => {

    });

    and('the client should receive the response headers from the downstream service', () => {

    });
  });

  scenario('Responses are returned from downstream', ({ given, when, then }) => {
    given(/^the downstream service shall return (.*)$/, (arg0) => {

    });

    when(/^the client sends (.*) a request to the proxy$/, (arg0) => {

    });

    then(/^the proxy return code should be (.*)$/, (arg0) => {

    });
  });

  // let requestBody: string
  // let response: Response

  // scenario("Post proxy is successfully sent", ({given, when, then}) => {
  //   given("we have an MVP proxy", () => {
  //     //what do we do here?
  //   })

  //   given("a http post request body", () => {
  //     requestBody = JSON.stringify({
  //       message: `Test execution at timestamp: ${Date.now()}`,
  //     })
  //   })

  //   when("we post the request to the MVP proxy endpoint successfully", async () => {
  //     response = await fetch(`${proxyUrl}`, {
  //       method: "POST",
  //       body: requestBody
  //     })
  //   })

  //   then("the return code will be 201", () => {
  //     expect(response.status).toBe(201)
  //   })
  // })

  // scenario('Post proxy fails', ({ given, and, when, then }) => {
  //   given('we have an MVP proxy', () => {

  //   })

  //   and('a http post request body', () => {

  //   })

  //   when('we post the request to the MVP proxy endpoint unsuccessfully', () => {

  //   })

  //   then("the return code will be 500", () => {

  //   })
  // })

  // scenario('Delete proxy succeeds', ({ given, and, when, then }) => {
  //   given('we have an MVP proxy', () => {

  //   })

  //   and('a http post request body', () => {

  //   })

  //   when('we post the request to the MVP proxy endpoint successfully', () => {

  //   })

  //   and('Then delete the resource with the same identifier', () => {

  //   })

  //   then("a get request for a resource with same identifier should give return code 404", () => {

  //   })
  // })

  // scenario('Get proxy succeeds', ({ given, and, when, then }) => {
  //   given('we have an MVP proxy', () => {

  //   })

  //   and('a http post request body', () => {

  //   })

  //   when('we post the request to the MVP proxy endpoint successfully', () => {

  //   })

  //   and('Then get the request with the same identifier', () => {

  //   })

  //   then("the return code will be 200", () => {

  //   })

  //   and('the content returned should match the content posted', () => {

  //   })
  // })
})
