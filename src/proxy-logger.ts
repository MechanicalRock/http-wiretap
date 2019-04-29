import { AWS } from "../src/xray"
import { ALBEvent } from "aws-lambda";

const appendLeadingZeros = (n: number) =>  n < 9 ? "0" + n : n

export const logProxyRequest = async (event: ALBEvent) => {
  if(!process.env.PROXY_BUCKET_NAME) {
    throw new Error("process.env.PROXY_BUCKET_NAME should be set to where you are writing out request logs")
  }

  const d = new Date()
  const year = d.getFullYear()
  const month = appendLeadingZeros(d.getMonth() + 1)
  const day = appendLeadingZeros(d.getDate())
  const hours = appendLeadingZeros(d.getHours())
  const minutes = appendLeadingZeros(d.getMinutes())
  const seconds = appendLeadingZeros(d.getSeconds())

  const { $response } = await new AWS.S3().putObject({
    Bucket: process.env.PROXY_BUCKET_NAME as string,
    Key: `${year}/${month}/${day}/log_${hours}:${minutes}:${seconds}`,
    Body: JSON.stringify({
      headers: event.headers,
      path: event.path,
      body: event.body,
      params: event.queryStringParameters
    })
  }).promise()

  if($response.error) {
    throw new Error(`Failed to write request logs. Received error: '${$response.error.message}'`)
  }
}
