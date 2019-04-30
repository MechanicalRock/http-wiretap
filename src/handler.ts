import { ALBEvent, ALBResult, S3CreateEvent } from 'aws-lambda';
import "isomorphic-fetch"
import { captureHttpsTraffic } from "./xray";
import { forwardProxy } from './proxy-forwarder';
import { logProxyRequest } from './proxy-logger';
import { sendHttpServiceRequest } from './proxy-http-service';

captureHttpsTraffic()

export const sendProxy = async (event: ALBEvent): Promise<ALBResult> => {
  await logProxyRequest(event)
  return await forwardProxy(event)
}

export const proxyToHttpService = async (event: S3CreateEvent) => {
  await sendHttpServiceRequest(event)
}
