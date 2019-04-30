import { ALBEvent, ALBResult } from 'aws-lambda';
import "isomorphic-fetch"
import { captureHttpsTraffic } from "./xray";
import { forwardProxy } from './proxy-forwarder';
import { logProxyRequest } from './proxy-logger';

captureHttpsTraffic()

export const sendProxy = async (event: ALBEvent): Promise<ALBResult> => {
  await logProxyRequest(event)
  return await forwardProxy(event)
}
