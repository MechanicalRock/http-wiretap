import { S3CreateEvent } from "aws-lambda";
import { AWS } from "../src/xray"
import { ProxyRequestPayload } from "./types";
import { sanitiseHttpHeaders, urlAndParams } from "./http-utils";

export const sendHttpServiceRequest = async (event: S3CreateEvent) => {
  const s3Client = new AWS.S3()

  const requests = event.Records.map(async ({ s3 }) => {
    console.log(`Processing record: ${JSON.stringify(s3)}`)

    const s3GetObjectOutput = await s3Client.getObject({
      Bucket: s3.bucket.name,
      Key: decodeURIComponent(s3.object.key.replace(/\+/g, " "))
    }).promise()

    if(s3GetObjectOutput.$response.error) {
      throw new Error(`Could not find request log with file key: ${s3.object.key}`)
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
