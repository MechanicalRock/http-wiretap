const putObjectSpy = jest.fn()

jest.mock("../src/xray", () => ({
  beginSegment: () => ({
    close: () => {},
    error: () => {}
  }),

  AWS: {
    S3: function() { return { putObject: putObjectSpy }}
  }
}))

import * as dateMock from "jest-date-mock"
import { logProxyRequest } from "../src/proxy-logger"
import { ALBEvent } from "aws-lambda";

const successResponse = {
  promise: () => ({ $response: {} })
}

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
    dateMock.clear()
  })

  it("should fail when PROXY_BUCKET_NAME not set", async () => {
    delete process.env.PROXY_BUCKET_NAME
    await expect(publishLogs()).rejects.toThrowError("process.env.PROXY_BUCKET_NAME should be set to where you are writing out request logs")
  })

  it("should publish log under correct bucket under the path format yyyy/mm/dd/log_hh:mm:ss", async () => {
    dateMock.advanceTo(new Date(2019, 5, 6, 18, 50, 45)) //month is always -1 in JS date
    putObjectSpy.mockReturnValue(successResponse)

    await publishLogs()

    expect(putObjectSpy.mock.calls.length).toBe(1)
    const { Bucket, Key } = putObjectSpy.mock.calls[0][0]

    expect(Bucket).toBe("test-bucket")
    expect(Key).toBe("2019/06/06/log_18:50:45")
  })

  it("should fail when error response is received from s3", async () => {
    putObjectSpy.mockReturnValue(errorResponse)
    await expect(publishLogs()).rejects.toThrowError("Failed to write request logs. Received error: 'Oops'")
  })

  it("should publish log containing the headers, params, path, method of the request", async () => {
    putObjectSpy.mockReturnValue(successResponse)

    await publishLogs()

    expect(putObjectSpy.mock.calls.length).toBe(1)
    const body = putObjectSpy.mock.calls[0][0].Body

    expect(JSON.parse(body)).toEqual({
      headers: {
        'content-type': 'application/json',
        'host': "www.myshop.com"
      },
      path: '/checkout',
      params: {
        amount: "200"
      },
      body: '{"firstName": "Tom", "lastName": "Jones"}',
    })
  })
})
