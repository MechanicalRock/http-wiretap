import { defineFeature, loadFeature } from "jest-cucumber"
import * as fetchMock from "fetch-mock"
import { ALBEvent, ALBResult } from "aws-lambda";
import { sendProxy } from "../../src/handler"

const feature = loadFeature("cucumber/features/proxying.feature")
const proxyUrl = "https://localhost:8085/downstream"

function givenLambdaProxyHasBeenConfigured(proxyUrl: string) {
  process.env.PROXY_URL = proxyUrl
}

defineFeature(feature, scenario => {
  let response: ALBResult

  beforeEach( () => {
    givenLambdaProxyHasBeenConfigured(proxyUrl)
  })

  async function whenTheClientSendsARequestToTheProxy(httpMethod: string) {
    const event: ALBEvent = {
      requestContext: {
        elb: { targetGroupArn: "aws:arn:fake" }
      },
      httpMethod,
      path: "/downstream",
      queryStringParameters: {},
      headers: {
        "x-forwarded-proto": "https",
        host: "localhost"
      },
      isBase64Encoded: false,
      body: null
    }

    response = await sendProxy(event);
  }

  describe('PROXY_URL is a required environment variable', () => {
    it('should fail when not set', async (done)=> {
      delete process.env.PROXY_URL
      try{
        await whenTheClientSendsARequestToTheProxy('GET')
        done.fail("Expected error to be thrown")
      }catch(err){
        expect(err.toString()).toContain("process.env.PROXY_URL should be set to the downstream proxied URL")
        done()
      }

    })

    it('should fail when set to an invalid URL', async (done) => {
      process.env.PROXY_URL = "localhost 8080"
      try{
        await whenTheClientSendsARequestToTheProxy('GET')
        done.fail("Expected error to be thrown")
      }catch(err){
        expect(err.toString()).toContain("process.env.PROXY_URL should be set to the downstream proxied URL")
        done()
      }

    })

    it('should fail when set to an empty string URL', async(done) => {
      process.env.PROXY_URL = ""
      try{
        await whenTheClientSendsARequestToTheProxy('GET')
        done.fail("Expected error to be thrown")
      }catch(err){
        expect(err.toString()).toContain("process.env.PROXY_URL should be set to the downstream proxied URL")
        done()
      }
    })
  })

  scenario('The downstream service fails to respond', ({ given, and, when, then }) => {
    given('the downstream service shall not respond', () => {

    });

    and(/^the proxy timeout is configured to (.*) second$/, (proxyTimeoutSecs: string) => {
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
      pending()
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
        matcher: proxyUrl
      })
    });

    when(/^the client sends (.*) a request to the proxy$/, async (httpMethod: string) => {
      const event: ALBEvent = {
        requestContext: {
          elb: { targetGroupArn: "aws:arn:fake" }
        },
        httpMethod,
        path: "/downstream",
        queryStringParameters: {},
        headers: {
          "x-forwarded-proto": "https",
          host: "localhost"
        },
        isBase64Encoded: false,
        body: null
      }

      response = await sendProxy(event);
    });

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.statusCode).toBe(statusCode)
    });
  });
})
