import { defineFeature, loadFeature } from "jest-cucumber"
import * as fetchMock from "fetch-mock"
import { ALBEvent, ALBResult } from "aws-lambda";
import { sendProxy } from "../../src/handler"

const feature = loadFeature("cucumber/features/proxying.feature")
const proxyUrl = "https://localhost:8085/downstream"
const proxyUrlWithParams = "https://localhost:8085/downstream?foo=param1&bar=param2"


defineFeature(feature, scenario => {
  let response: ALBResult
  let downstreamRequestElapsedTimeMillis: number

  function givenLambdaProxyHasBeenConfigured(proxyUrl: string) {
    process.env.PROXY_URL = proxyUrl
  }

  function givenProxyTimeoutIsConfigured(proxyTimeoutSecs: string) {
    process.env.PROXY_TIMEOUT_SECONDS = proxyTimeoutSecs
  }

  async function whenTheClientSendsARequestToTheProxyDefault() {
    return whenTheClientSendsARequestToTheProxy('POST')
  }

  async function whenTheClientSendsARequestToTheProxy(httpMethod: string) {
    const event: ALBEvent = {
      requestContext: {
        elb: { targetGroupArn: "aws:arn:fake" }
      },
      httpMethod,
      path: "/downstream",
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

    const startTime = Date.now()
    response = await sendProxy(event);
    downstreamRequestElapsedTimeMillis = Date.now() - startTime
    return response
  }

  beforeEach(() => {
    givenLambdaProxyHasBeenConfigured(proxyUrl)
    givenProxyTimeoutIsConfigured("30000");
  })

  describe('PROXY_URL is a required environment variable', () => {
    it('should fail when not set', async (done) => {
      delete process.env.PROXY_URL
      try {
        await whenTheClientSendsARequestToTheProxy('GET')
        done.fail("Expected error to be thrown")
      } catch (err) {
        expect(err.toString()).toContain("process.env.PROXY_URL should be set to the downstream proxied URL")
        done()
      }

    })

    it('should fail when set to an invalid URL', async (done) => {
      process.env.PROXY_URL = "localhost 8080"
      try {
        await whenTheClientSendsARequestToTheProxy('GET')
        done.fail("Expected error to be thrown")
      } catch (err) {
        expect(err.toString()).toContain("process.env.PROXY_URL should be set to the downstream proxied URL")
        done()
      }

    })

    it('should fail when set to an empty string URL', async (done) => {
      process.env.PROXY_URL = ""
      try {
        await whenTheClientSendsARequestToTheProxy('GET')
        done.fail("Expected error to be thrown")
      } catch (err) {
        expect(err.toString()).toContain("process.env.PROXY_URL should be set to the downstream proxied URL")
        done()
      }
    })
  })

  scenario('The downstream service fails to respond', ({ given, and, when, then }) => {
    given('the downstream service shall not respond', () => {
      const longDelayedResponse = new Promise(res => setTimeout(() => {
        res()
      }, 500000))

      fetchMock.post(proxyUrlWithParams, longDelayedResponse);
    });

    and(/^the proxy timeout is configured to (.*) second$/, (proxyTimeoutSecs: string) => {
      givenProxyTimeoutIsConfigured(proxyTimeoutSecs)
    });

    when('the client send a request to the proxy', whenTheClientSendsARequestToTheProxyDefault);

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.statusCode).toEqual(Number(statusCode))
    });

    and(/^the proxy should return within (.*) seconds$/, (elapsedTime: string) => {
      expect(downstreamRequestElapsedTimeMillis).toBeLessThan(Number(elapsedTime) * 1000)
    });
  });

  scenario('Transparent proxying of requests downstream', ({ when, then, and }) => {

    
    when('the client send a request to the proxy', async () => {
      // TODO - this should be in a beforEach - but fails.  WHY???
      fetchMock.reset()
      fetchMock.post(proxyUrlWithParams, 200)

      await whenTheClientSendsARequestToTheProxyDefault()
    });
    
    then('the request body should be received by the downstream service', () => {
      const lastOptions: any = fetchMock.lastOptions()
      expect(lastOptions.body).toBeDefined()
      expect(lastOptions.body).toEqual("The request body")
    });
    
    and('the request headers should be received by the downstream service', () => {
      const lastOptions = fetchMock.lastOptions()
      expect(lastOptions.headers).toBeDefined()
      expect(lastOptions.headers).toEqual({
        "x-forwarded-proto": "https",
        host: "localhost"
      })
    });
    
    and('the request parameters should be received by the downstream service', () => {
      const url = fetchMock.lastUrl()
      expect(url).toEqual(`${proxyUrl}?foo=param1&bar=param2`)
      
    });

    and('the request path should be received by the downstream service', () => {
      expect(fetchMock.lastUrl()).toContain('/downstream')
    });
  });

  scenario('Proxying downstream path URL', ({ given, when, then }) => {
    given(/^the downstream service URL is configured as (.*)$/, (arg0) => {
      pending()
    });

    when('the request path "/foo/bar/baz?something=awesome" is sent to the proxy', (arg0) => {

    });

    then('the downstream service should receive the path "/mypath/foo/bar/baz?something=awesome"', (arg0) => {

    });
  });

  scenario('Response bodies are returned upstream', ({ given, when, then, and }) => {
    given('the downstream service shall respond with a response body', () => {
      pending()
    });

    when('the client sends a request to the proxy', () => {

    });

    then('the client should receive the response body from the downstream service', () => {

    });

    and('the client should receive the response headers from the downstream service', () => {

    });
  });



  scenario('Responses are returned from downstream', ({ given, when, then }) => {
    beforeEach(() => {
      fetchMock.reset()
    });

    given(/^the downstream service shall return (\d+)$/, async (statusCode: string) => {
      fetchMock.mock({
        response: { status: statusCode },
        matcher: proxyUrlWithParams
      })
    });

    when(/^the client sends (.*) a request to the proxy$/, whenTheClientSendsARequestToTheProxy);

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.statusCode).toBe(statusCode)
    });
  });
})
