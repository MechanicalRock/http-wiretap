import * as AWSXray from "aws-xray-sdk"
import * as http from "http"
import * as https from "https"

export const caputureOutgoingHttpTraffic = () => {
  AWSXray.captureHTTPsGlobal(http)
  AWSXray.captureHTTPsGlobal(https)
}

export const beginSegment = (name: string) => {
  caputureOutgoingHttpTraffic()
  const segment = new AWSXray.Segment(name)
  return segment
}
