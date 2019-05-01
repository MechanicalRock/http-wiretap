import { S3CreateEvent } from "aws-lambda";
import { AWS } from "../src/xray"
import { ProxyRequestPayload } from "./types";
import { sanitiseHttpHeaders, urlAndParams } from "./http-utils";

export const forwardProxyToHttpService = async (event: S3CreateEvent) => {
  const s3Client = new AWS.S3()

  const requests = event.Records.map(async ({ s3 }) => {
    const decodedKey = decodeURIComponent(s3.object.key.replace(/\+/g, " "))

    const s3GetObjectOutput = await s3Client.getObject({
      Bucket: s3.bucket.name,
      Key: decodedKey
    }).promise()

    if(s3GetObjectOutput.$response.error) {
      throw new Error(`Failed to get object with key: '${decodedKey}'. Cause: '${s3GetObjectOutput.$response.error.message}'`)
    }
    const { method, path, body, headers, params } = JSON.parse(s3GetObjectOutput.Body as string) as ProxyRequestPayload

    if(method === "POST") {
      return fetch(urlAndParams(`${process.env.HTTP_SERVICE_URL}${path}`, params), {
        method,
        body,
        headers: sanitiseHttpHeaders(headers)
      })
    }
  })

  await Promise.all(requests)
}
