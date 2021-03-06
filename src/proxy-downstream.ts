import { ALBEvent, ALBResult } from 'aws-lambda';
import "isomorphic-fetch"
import { AbortController } from "abort-controller"
import { isValidUrl, urlAndParams, sanitiseHttpHeaders, encodeResponseHeaders } from "./http-utils";

export const configureTimeout = (): AbortSignal => {
  // Ideally we have timeout OR signal, but for backward compability with fetch-mock we need to use signal
  const controller = new AbortController()
  const proxyTimeoutSeconds = Number(process.env.PROXY_TIMEOUT_SECONDS) * 1000

  setTimeout(() => controller.abort(), proxyTimeoutSeconds)

  return controller.signal
}

export const isTimedoutError = (err) => {

  // Blocked in testing by https://github.com/wheresrhys/fetch-mock/pull/418
  const isMocked = err.toString().includes("aborted")

  if(isMocked) {
    return true
  } else {
    return err.type === 'request-timeout'
  }
}

export const forwardProxyToDownstreamService = async (event: ALBEvent): Promise<ALBResult> => {
  const { httpMethod, headers, body, queryStringParameters, path } = event
  const proxyUrl = process.env.PROXY_URL

  if (!isValidUrl(proxyUrl)) {
    throw new Error('process.env.PROXY_URL should be set to the downstream proxied URL')
  }

  try {
    const fullPath = urlAndParams(`${proxyUrl}${path}`, queryStringParameters)

    const response: Response = await fetch(fullPath, {
      method: httpMethod,
      timeout: Number(process.env.PROXY_TIMEOUT_SECONDS) * 1000,
      signal: configureTimeout(),
      headers: sanitiseHttpHeaders(headers),
      body
    } as RequestInit)

    const encodedHeaders = sanitiseHttpHeaders(encodeResponseHeaders(response))

    return {
      isBase64Encoded: false,
      statusCode: response.status,
      statusDescription: `${response.status} Done`,
      headers: encodedHeaders,
      body: await response.text()
    };

  } catch (e) {
    if (isTimedoutError(e)) {
      return {
        isBase64Encoded: false,
        statusCode: 502,
        statusDescription: '502 Timeout',
        body: ""
      };
    } else {
      throw e
    }
  }
}
