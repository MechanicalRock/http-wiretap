import { ALBEvent, ALBResult, S3CreateEvent } from 'aws-lambda';
import "isomorphic-fetch"
import { captureHttpsTraffic } from "./xray";
import { forwardProxyToDownstreamService } from './proxy-downstream';
import { logProxyRequest } from './proxy-logger';
import { forwardProxyToHttpService } from './proxy-http-service';

captureHttpsTraffic()

export const sendProxy = async (event: ALBEvent): Promise<ALBResult> => {
  await logProxyRequest(event)
  return await forwardProxyToDownstreamService(event)
}

export const proxyToHttpService = async (event: S3CreateEvent) => {
  await forwardProxyToHttpService(event)
}
