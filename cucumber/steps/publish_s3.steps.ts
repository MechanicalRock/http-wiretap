const s3PutObjectSpy = jest.fn()

jest.mock("../../src/xray", () => ({
  AWS: {
    S3: function() { return { putObject: s3PutObjectSpy }}
  }
}))

import { defineFeature, loadFeature } from "jest-cucumber"
import * as dateMock from "jest-date-mock"
import { logProxyRequest } from "../../src/proxy-logger"
import { ALBEvent } from "aws-lambda"

const successResponse = {
  promise: () => ({ $response: {} })
}

const publishLogs = () => logProxyRequest({
  isBase64Encoded: false,
  requestContext: {
    elb: { targetGroupArn: "arn:aws:elb:fake" },
  },
  httpMethod: "POST",
  path: "/checkout",
  queryStringParameters: {
    amount: "200",
    limit: "500"
  },
  headers: {
    'content-type': 'application/json',
    'host': "www.myshop.com"
  },
  body: '{"firstName": "Tom", "lastName": "Jones"}',
} as ALBEvent)

process.env.PROXY_BUCKET_NAME = "test-bucket"

const feature = loadFeature("cucumber/features/publish_s3.feature")

defineFeature(feature, scenario => {
  let s3PutObjectBody: {
    path: string,
    body: string,
    headers: {[key: string]: string},
    params: {[key: string]: string},
    method: string
  }

  beforeEach(() => {
    dateMock.advanceTo(new Date(2019, 5, 6, 18, 50, 45)) //month is always -1 in JS date library
    s3PutObjectSpy.mockReturnValue(successResponse)
  })

  afterEach(() => {
    jest.resetAllMocks()
    dateMock.clear()
  })


  scenario('Client requests are published to S3', ({ given, then, and }) => {
    given('the client has sent a request to the proxy', async () => {
      await publishLogs()
    })

    then('a log file should be published to S3 under the date separated path', () => {
      expect(s3PutObjectSpy.mock.calls.length).toBe(1)

      const { Bucket, Key, Body } = s3PutObjectSpy.mock.calls[0][0]
      s3PutObjectBody = JSON.parse(Body)

      expect(Bucket).toBe("test-bucket")
      expect(Key).toBe("2019/06/06/request_18:50:45")
    })

    and('it should contain the request headers', () => {
      expect(s3PutObjectBody.headers).toEqual({
        'content-type': 'application/json',
        'host': "www.myshop.com"
      })
    })

    and('it should contain the request path', () => {
      expect(s3PutObjectBody.path).toBe('/checkout')
    })

    and('it should contain the request params', () => {
      expect(s3PutObjectBody.params).toEqual({
        amount: "200",
        limit: "500"
      })
    })

    and('it should contain the request body', () => {
      expect(s3PutObjectBody.body).toBe('{"firstName": "Tom", "lastName": "Jones"}')
    })

    and('it should contain the request method', () => {
      expect(s3PutObjectBody.method).toBe('POST')
    })
  })
})
