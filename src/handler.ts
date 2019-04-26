import AbortController from 'abort-controller';
import { ALBEvent, ALBResult } from 'aws-lambda';
import { isWebUri } from 'valid-url';
import "isomorphic-fetch"

export const isValid = (proxyUrl: string): boolean => {
  return isWebUri(proxyUrl) !== undefined;
}

export const isTimedoutError = (err) => {

  // Blocked in testing by https://github.com/wheresrhys/fetch-mock/pull/418
  const isMocked = err.toString().includes("aborted")
  return err.name == 'AbortError' || isMocked
}

export const urlAndParams = (url: string, params: any) => {
  const paramStr = Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
  return `${url}?${paramStr}`
}

declare type ResponseHeader = { [header: string]: string }

/**
 * Encodes the HTTPResponse headers into a { key: value } dict.
 * NOTE: header names are lower-case
 * @see https://stackoverflow.com/a/5259004/10450721
 * @param response The HTTPResponse
 */
export const encodeResponseHeaders = (response: Response): ResponseHeader => {
  const headers: ResponseHeader = {}
  response.headers.forEach((value, header) => {
    // `header` is the lower case version - performed in the `forEach`.
    // Ideally, preserving case would be preferable, to ensure no side effects
    // but according to the spec, header names are case insensitive.
    headers[header] = value
  })
  return headers
}

const sanitiseResponseHeaders = (headers: ResponseHeader): ResponseHeader => {
  // Simply copying this across produces SSL errors when lambda makes request to downstream service
  delete headers['host']
  return headers
}

const configureTimeout = (): AbortSignal => {
  const controller = new AbortController()
  const proxyTimeoutSeconds = Number(process.env.PROXY_TIMEOUT_SECONDS) * 1000

  setTimeout(() => {
    controller.abort()
  }, proxyTimeoutSeconds)

  return controller.signal
}

export const sendProxy = async (event: ALBEvent): Promise<ALBResult> => {
  const { httpMethod, headers, body, queryStringParameters, path } = event
  const proxyUrl = process.env.PROXY_URL

  if (!isValid(proxyUrl)) {
    throw new Error('process.env.PROXY_URL should be set to the downstream proxied URL')
  }

  try {
    const fullPath = urlAndParams(`${proxyUrl}${path}`, queryStringParameters)

    const response: Response = await fetch(fullPath, {
      method: httpMethod,
      signal: configureTimeout(),
      headers: sanitiseResponseHeaders(headers),
      body
    })

    const encodedHeaders = sanitiseResponseHeaders(encodeResponseHeaders(response))

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
