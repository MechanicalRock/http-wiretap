const s3GetObjectSpy = jest.fn()

jest.mock("../../src/xray", () => ({
  AWS: {
    S3: function() { return {
      getObject: s3GetObjectSpy
    }}
  }
}))

import { defineFeature, loadFeature } from "jest-cucumber"
import * as fetchMock from "fetch-mock"
import { S3CreateEvent } from "aws-lambda";
import { ProxyRequestPayload } from "../../src/types"
import { forwardProxyToHttpService } from "../../src/proxy-http-service"

const feature = loadFeature("cucumber/features/proxying_http_service.feature")
process.env.HTTP_SERVICE_URL = "http://external-service/v1"

const whenTheContentsOfARequestAreUploadedToS3 = async (requestEventBody: ProxyRequestPayload) => {
  s3GetObjectSpy.mockReturnValue({
    promise: () => ({
      Body: JSON.stringify(requestEventBody),
      $response: {}
    })
  })

  // in integration test, uploading to S3 should trigger this function execution
  await forwardProxyToHttpService({
    Records: [{
      s3: {
        bucket: {
            name: "test-bucket"
        },
        object: {
            key: "/files",
        }
      }

    }]
  } as S3CreateEvent)
}

defineFeature(feature, scenario => {
  let requestEventBody: ProxyRequestPayload

  beforeEach(() => {
    fetchMock.mock( /v1/, "{}")
  })

  afterEach(() => {
    fetchMock.reset()
    jest.resetAllMocks()
  })

  scenario('Client host header should not be forwarded to http service', ({ given, when, then, but }) => {
    given(/^a proxy POST request that was made downstream$/, () => {
      requestEventBody = {
        path: "/",
        body: "",
        method: "POST",
        params: {},
        headers: {
          host: "somehost.com"
        }
      }
    })

    when(/^the request is logged onto S3$/, async () => {
      await whenTheContentsOfARequestAreUploadedToS3(requestEventBody)
    })

    then('the proxy should forward the request to the http service', () => {
      expect(fetchMock.lastUrl()).toBe("http://external-service/v1/")
    })

    but(/^the host header should not be directly copied across$/, () => {
      expect(fetchMock.lastOptions().headers.host).not.toBe("somehost.com")
    })
  })

  scenario('Client request params, headers, body are forwarded on same path to the http service', ({ given, when, then, and }) => {
    given('a proxy POST request that was made downstream with specific headers, query, body and path', () => {
      requestEventBody = {
        path: "/checkpoint",
        body: '{"firstName": "John", "lastName": "Doe"}',
        method: "POST",
        params: {
          group: "mechanicalrock"
        },
        headers: {
          'content-type': 'application/json',
          'etag': '1234ABC'
        }
      }
    })

    when(/^the request is logged onto S3$/, async () => {
      await whenTheContentsOfARequestAreUploadedToS3(requestEventBody)
    })

    then('the proxy should forward the request to the http service on the same path', () => {
      expect(fetchMock.lastUrl()).toBeDefined()
      expect(fetchMock.lastUrl()).toBe("http://external-service/v1/checkpoint?group=mechanicalrock")
    })

    and('the request should have the same query params', () => {
      expect(fetchMock.lastUrl()).toContain("?group=mechanicalrock")
    })

    and('the request should have the same headers params', () => {
      expect(fetchMock.lastOptions().headers).toBeDefined()
      expect(fetchMock.lastOptions().headers).toEqual({
        'content-type': 'application/json',
        'etag': '1234ABC'
      })
    })

    and('the request should have the same body params', () => {
      const requestPayload = fetchMock.lastCall()[1] as ProxyRequestPayload

      expect(requestPayload).toBeDefined()
      expect(requestPayload.body).toBe('{"firstName": "John", "lastName": "Doe"}')
    })
  })

  scenario('Non POST requests are not forwarded', ({ when, given, then }) => {
    given(/^a proxy GET request that was made downstream$/, async () => {
      requestEventBody = {
        path: "/bananas",
        method: "GET",
        params: {},
        headers: {}
      }
    })

    when("the request is logged onto S3", async () => {
      await whenTheContentsOfARequestAreUploadedToS3(requestEventBody)
    })

    then(/^the proxy should not forward the request to the http service$/, () => {
      expect(fetchMock.called()).toBeFalsy()
    })
  })
})
