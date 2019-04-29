import { encodeResponseHeaders, sendProxy } from "../src/handler"
import { ALBEvent } from "aws-lambda"

describe('proxy lambda', () => {
  describe('#encodeResponseHeaders', () => {
    it('should return {} if headers is not defined', () => {
      const response = new Response('something')
      // typing mismatch?
      expect(encodeResponseHeaders(response as any)).toEqual({})
    })
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
})

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

  const response = await sendProxy(event);
  return response
}
