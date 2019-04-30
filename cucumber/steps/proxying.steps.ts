import { defineFeature, loadFeature } from "jest-cucumber"
import * as fetchMock from "fetch-mock"
import { ALBEvent, ALBResult } from "aws-lambda";
import { forwardProxy } from "../../src/proxy-forwarder"
import { Response } from 'node-fetch'

const feature = loadFeature("cucumber/features/proxying.feature")
const proxyUrl = "https://localhost:8085/downstream"
const proxiedUrlMatcher = /downstream/

const runTimedCallback = async (cb: () => Promise<ALBResult>) => {
  const startTime = Date.now()
  const response = await cb()

  return {
    elapsedTime: Date.now() - startTime,
    response
  }
}

defineFeature(feature, scenario => {
  let response: ALBResult
  let downstreamRequestElapsedTimeMillis: number

  function givenLambdaProxyHasBeenConfigured(proxyUrl: string) {
    process.env.PROXY_URL = proxyUrl
  }

  function givenProxyTimeoutIsConfigured(proxyTimeoutSecs: string) {
    process.env.PROXY_TIMEOUT_SECONDS = proxyTimeoutSecs
  }

  async function whenTheClientSendsAnyRequestToTheProxy() {
    return whenTheClientSendsARequestToTheProxy('POST')
  }

  async function whenTheClientSendsARequestToTheProxy(httpMethod: string) {
    const event: ALBEvent = {
      requestContext: {
        elb: { targetGroupArn: "aws:arn:fake" }
      },
      httpMethod,
      path: "/service",
      queryStringParameters: {
        foo: "param1",
        bar: "param2"
      },
      headers: {
        "x-forwarded-proto": "https",
        host: "localhost"
      },
      isBase64Encoded: false,
      body: "The request body"
    }

    const executionResult = await runTimedCallback(() => forwardProxy(event));

    downstreamRequestElapsedTimeMillis = executionResult.elapsedTime
    response = executionResult.response
  }

  beforeEach(() => {
    givenLambdaProxyHasBeenConfigured(proxyUrl)
    givenProxyTimeoutIsConfigured("30000");
  })

  afterEach(() => {
    fetchMock.reset()
  })

  scenario('The downstream service fails to respond', ({ given, and, when, then }) => {
    given('the downstream service shall not respond', () => {
      const longDelayedResponse = new Promise(res => setTimeout(() => {
        res()
      }, 500000))

      fetchMock.post(proxiedUrlMatcher, longDelayedResponse);
    });

    and(/^the proxy timeout is configured to (.*) second$/, (proxyTimeoutSecs: string) => {
      givenProxyTimeoutIsConfigured(proxyTimeoutSecs)
    });

    when('the client send a request to the proxy', whenTheClientSendsAnyRequestToTheProxy);

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.statusCode).toEqual(Number(statusCode))
    });

    and(/^the proxy should return within (.*) seconds$/, (elapsedTime: string) => {
      expect(downstreamRequestElapsedTimeMillis).toBeLessThan(Number(elapsedTime) * 1000)
    });
  });

  scenario('Transparent proxying of requests downstream', ({ when, then, and }) => {

    when('the client send a request to the proxy', async () => {
      // Ideally this should be in a beforeEach as an implicit background step.
      // However `beforeEach()` are not currently scoped in jest-cucumber - they run before EVERY scenario
      fetchMock.post(proxiedUrlMatcher, 200)

      await whenTheClientSendsAnyRequestToTheProxy()
    });

    then('the request body should be received by the downstream service', () => {
      const lastOptions: any = fetchMock.lastOptions()
      expect(lastOptions.body).toBeDefined()
      expect(lastOptions.body).toEqual("The request body")
    });

    and('the request headers excluding the host should be received by the downstream service', () => {
      const lastOptions = fetchMock.lastOptions()
      expect(lastOptions.headers).toBeDefined()
      expect(lastOptions.headers).toEqual({
        "x-forwarded-proto": "https",
      })
    });

    and('the request parameters should be received by the downstream service', () => {
      const url = fetchMock.lastUrl()
      expect(url).toEqual(`${proxyUrl}/service?foo=param1&bar=param2`)

    });

    and('the request path should be received by the downstream service', () => {
      expect(fetchMock.lastUrl()).toContain('/service')
    });
  });

  scenario('Response bodies are returned upstream', ({ given, when, then, and }) => {

    const downstreamResponseBody = {
      foo: 'bar'
    }

    const downstreamResponse: Response = new Response(JSON.stringify(downstreamResponseBody), {
      headers: {
        'Content-Type': "application/json",
        'Accept-Type': "application/text"
      },
      status: 200
    })

    given('the downstream service shall respond with a response body', () => {
      fetchMock.post(proxiedUrlMatcher, downstreamResponse)
    });

    when('the client sends a request to the proxy', async () => {
      await whenTheClientSendsARequestToTheProxy('POST')
    });

    then('the client should receive the response body from the downstream service', () => {
      expect(response.body).toBeDefined()
      const stringifiedJsonBody = '{"foo":"bar"}'
      expect(response.body).toEqual(stringifiedJsonBody)
    });

    and('the client should receive the response headers from the downstream service', () => {
      expect(response.headers).toBeDefined()
      // Header names are case insensitive
      // https://stackoverflow.com/a/5259004/10450721
      expect(response.headers).toEqual({
        'content-type': "application/json",
        'accept-type': "application/text"
      })
    });
  });

  scenario('Responses are returned from downstream', ({ given, when, then }) => {

    given(/^the downstream service shall return (\d+)$/, async (statusCode: string) => {
      fetchMock.mock({
        response: { status: statusCode },
        matcher: proxiedUrlMatcher
      })
    });

    when(/^the client sends (.*) a request to the proxy$/, whenTheClientSendsARequestToTheProxy);

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.statusCode).toBe(statusCode)
    });
  });

})
