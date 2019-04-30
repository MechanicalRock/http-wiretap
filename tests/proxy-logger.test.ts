const putObjectSpy = jest.fn()

jest.mock("../src/xray", () => ({
  AWS: {
    S3: function() { return { putObject: putObjectSpy }}
  }
}))

import { logProxyRequest } from "../src/proxy-logger"
import { ALBEvent } from "aws-lambda";

const errorResponse = {
  promise: () => ({ $response: { error: { message: "Oops" }}})
}

const publishLogs = () => logProxyRequest({
  isBase64Encoded: false,
  requestContext: {
    elb: { targetGroupArn: "arn" },
  },
  httpMethod: "POST",
  path: "/checkout",
  queryStringParameters: {
    amount: "200"
  },
  headers: {
    'content-type': 'application/json',
    'host': "www.myshop.com"
  },
  body: '{"firstName": "Tom", "lastName": "Jones"}',
} as ALBEvent)

describe("PROXY_BUCKET_NAME is a required environment variable", () => {
  beforeEach(() => {
    process.env.PROXY_BUCKET_NAME = "test-bucket"
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should fail when PROXY_BUCKET_NAME not set", async () => {
    delete process.env.PROXY_BUCKET_NAME
    await expect(publishLogs()).rejects.toThrowError("process.env.PROXY_BUCKET_NAME should be set to where you are writing out request logs")
  })

  it("should fail when error response is received from s3", async () => {
    putObjectSpy.mockReturnValue(errorResponse)
    await expect(publishLogs()).rejects.toThrowError("Failed to write request logs. Received error: 'Oops'")
  })
})
