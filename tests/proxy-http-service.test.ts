const s3GetObjectSpy = jest.fn()

jest.mock("../src/xray", () => ({
  AWS: {
    S3: function() { return {
      getObject: s3GetObjectSpy
    }}
  }
}))

import { sendHttpServiceRequest } from "../src/proxy-http-service";
import { S3CreateEvent } from "aws-lambda";

describe("ProxyHttpService", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should decode object keys with unicode characters", async () => {
    s3GetObjectSpy.mockReturnValue({
      promise: () => ({ Body: "{}", $response: {}})
    })

    await sendHttpServiceRequest({
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
    } as S3CreateEvent)

    expect(s3GetObjectSpy).toBeCalledWith({
      Bucket: 'test-bucket',
      Key: 'mock_file_10:07:23'
    })
  })
})
