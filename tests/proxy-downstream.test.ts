import { forwardProxyToDownstreamService } from "../src/proxy-downstream"
import { encodeResponseHeaders } from "../src/http-utils"
import { ALBEvent } from "aws-lambda";

describe('proxy lambda', () => {
  describe('#encodeResponseHeaders', () => {
    it('should return {} if headers is not defined', () => {
      expect(encodeResponseHeaders(new Response())).toEqual({})
    })
  })

  describe('PROXY_URL is a required environment variable', () => {

    it('should fail when not set', async () => {
      delete process.env.PROXY_URL
      await expect(whenTheClientSendsARequestToTheProxy('GET')).rejects.toThrowError("process.env.PROXY_URL should be set to the downstream proxied URL")
    })

    it('should fail when set to an invalid URL', async () => {
      process.env.PROXY_URL = "localhost 8080"
      await expect(whenTheClientSendsARequestToTheProxy('GET')).rejects.toThrowError("process.env.PROXY_URL should be set to the downstream proxied URL")
    })

    it('should fail when set to an empty string URL', async () => {
      process.env.PROXY_URL = ""
      await expect(whenTheClientSendsARequestToTheProxy('GET')).rejects.toThrowError("process.env.PROXY_URL should be set to the downstream proxied URL")
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

  const response = await forwardProxyToDownstreamService(event);
  return response
}
