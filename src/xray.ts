import * as AWSXray from "aws-xray-sdk"
import * as AWSSdk from "aws-sdk"
import * as http from "http"
import * as https from "https"

export const captureHttpsTraffic = () => {
  AWSXray.captureHTTPsGlobal(http)
  AWSXray.captureHTTPsGlobal(https)
}

export const beginSegment = (name: string) => {
  const segment = new AWSXray.Segment(name)
  return segment
}

export const AWS = AWSXray.captureAWS(AWSSdk) as typeof AWSSdk
