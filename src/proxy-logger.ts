import { AWS } from "../src/xray"
import { ALBEvent } from "aws-lambda";

const appendLeadingZeros = (n: number) =>  n < 9 ? "0" + n : n

export const logProxyRequest = async (event: ALBEvent) => {
  if(!process.env.PROXY_BUCKET_NAME) {
    throw new Error("process.env.PROXY_BUCKET_NAME should be set to where you are writing out request logs")
  }

  const date = new Date()
  const year = date.getFullYear()
  const month = appendLeadingZeros(date.getMonth() + 1)
  const day = appendLeadingZeros(date.getDate())
  const hours = appendLeadingZeros(date.getHours())
  const minutes = appendLeadingZeros(date.getMinutes())
  const seconds = appendLeadingZeros(date.getSeconds())

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
