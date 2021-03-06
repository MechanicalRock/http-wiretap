import * as AWSXray from "aws-xray-sdk"
import * as AWSSdk from "aws-sdk"
import * as http from "http"
import * as https from "https"

export const captureHttpsTraffic = () => {
  AWSXray.captureHTTPsGlobal(http)
  AWSXray.captureHTTPsGlobal(https)
}

export const AWS = AWSXray.captureAWS(AWSSdk) as typeof AWSSdk
