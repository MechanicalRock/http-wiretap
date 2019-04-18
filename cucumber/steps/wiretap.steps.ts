import { defineFeature, loadFeature } from "jest-cucumber";

const feature = loadFeature("cucumber/features/wiretap.feature")

defineFeature(feature, scenario => {

  scenario("Post proxy is successfully sent", ({given, when, then}) => {
    given("we have an MVP proxy", () => {
    })

    given("a http post request body", () => {
    });

    when("we post the request to the MVP proxy endpoint successfully", () => {
    })

    then("the return code will be 201", () => {
      expect(true).toBe(false)
    })
  })

  scenario('Delete proxy succeeds', ({ given, and, when, then }) => {
    given('we have an MVP proxy', () => {

    });

    and('a http post request body', () => {

    });

    when('we post the request to the MVP proxy endpoint successfully', () => {

    });

    and('Then delete the resource with the same identifier', () => {

    });

    then(/^a get request for a resource with same identifier should give return code (.*)$/, (arg0) => {

    });
  });

  scenario('Post proxy fails', ({ given, and, when, then }) => {
    given('we have an MVP proxy', () => {

    });

    and('a http post request body', () => {

    });

    when('we post the request to the MVP proxy endpoint unsuccessfully', () => {

    });

    then(/^the return code will be (.*)$/, (arg0) => {

    });
  });

  scenario('Get proxy succeeds', ({ given, and, when, then }) => {
    given('we have an MVP proxy', () => {

    });

    and('a http post request body', () => {

    });

    when('we post the request to the MVP proxy endpoint successfully', () => {

    });

    and('Then get the request with the same identifier', () => {

    });

    then(/^the return code will be (.*)$/, (arg0) => {

    });

    and('the content returned should match the content posted', () => {

    });
  });
})
