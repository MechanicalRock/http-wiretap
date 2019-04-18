import { defineFeature, loadFeature } from "jest-cucumber"
import fetch, { Response } from "node-fetch"

const feature = loadFeature("cucumber/features/wiretap.feature")
const proxyUrl = ""

defineFeature(feature, scenario => {
  let requestBody: string
  let response: Response

  scenario("Post proxy is successfully sent", ({given, when, then}) => {
    given("we have an MVP proxy", () => {
      //what do we do here?
    })

    given("a http post request body", () => {
      requestBody = JSON.stringify({
        message: `Test execution at timestamp: ${Date.now()}`,
      })
    })

    when("we post the request to the MVP proxy endpoint successfully", async () => {
      response = await fetch(`${proxyUrl}`, {
        method: "POST",
        body: requestBody
      })
    })

    then("the return code will be 201", () => {
      expect(response.status).toBe(201)
    })
  })

  scenario('Post proxy fails', ({ given, and, when, then }) => {
    given('we have an MVP proxy', () => {

    })

    and('a http post request body', () => {

    })

    when('we post the request to the MVP proxy endpoint unsuccessfully', () => {

    })

    then("the return code will be 500", () => {

    })
  })

  scenario('Delete proxy succeeds', ({ given, and, when, then }) => {
    given('we have an MVP proxy', () => {

    })

    and('a http post request body', () => {

    })

    when('we post the request to the MVP proxy endpoint successfully', () => {

    })

    and('Then delete the resource with the same identifier', () => {

    })

    then("a get request for a resource with same identifier should give return code 404", () => {

    })
  })

  scenario('Get proxy succeeds', ({ given, and, when, then }) => {
    given('we have an MVP proxy', () => {

    })

    and('a http post request body', () => {

    })

    when('we post the request to the MVP proxy endpoint successfully', () => {

    })

    and('Then get the request with the same identifier', () => {

    })

    then("the return code will be 200", () => {

    })

    and('the content returned should match the content posted', () => {

    })
  })
})
