const s3GetObjectSpy = jest.fn()

jest.mock("../src/xray", () => ({
  AWS: {
    S3: function() { return {
      getObject: s3GetObjectSpy
    }}
  }
}))

import { forwardProxyToHttpService } from "../src/proxy-http-service";
import { S3Event } from "aws-lambda";

const mockS3Event = {
  Records: [{
    s3: {
      bucket: {
          name: "test-bucket"
      },
      object: {
          key: "mock_file_10%3A07%3A23",
      }
    }
  }]
} as S3Event

describe("ProxyHttpService", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should throw an error fails to get object from S3", async () => {
    s3GetObjectSpy.mockReturnValue({
      promise: () => ({
        $response: {
          error: { message: "Access Denied!" }
        }
      })
    })

    await expect(forwardProxyToHttpService(mockS3Event)).rejects.toThrowError("Failed to get object with key: 'mock_file_10:07:23'. Cause: 'Access Denied!'")
  })

  it("should decode object keys with unicode characters", async () => {
    s3GetObjectSpy.mockReturnValue({
      promise: () => ({ Body: "{}", $response: {}})
    })

    await forwardProxyToHttpService(mockS3Event)

    expect(s3GetObjectSpy).toBeCalledWith({
      Bucket: 'test-bucket',
      Key: 'mock_file_10:07:23'
    })
  })
})
