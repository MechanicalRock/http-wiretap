import AbortController from 'abort-controller';
import { ALBEvent, ALBResult } from 'aws-lambda';
import { isWebUri } from 'valid-url';

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

export const sendProxy = async (event: ALBEvent): Promise<ALBResult> => {
  const controller = new AbortController()
  const { httpMethod, headers, body, queryStringParameters } = event

  const proxyUrl = process.env.PROXY_URL

  if (!isValid(proxyUrl)) {
    throw new Error('process.env.PROXY_URL should be set to the downstream proxied URL')
  }

  const proxyTimeoutSeconds = Number(process.env.PROXY_TIMEOUT_SECONDS)
  setTimeout(() => {
    controller.abort()
  }, proxyTimeoutSeconds)

  try {
    const response: Response = await fetch(urlAndParams(proxyUrl, queryStringParameters), {
      method: httpMethod,
      signal: controller.signal,
      headers,
      body
    })

    return {
      isBase64Encoded: false,
      statusCode: response.status,
      statusDescription: `${response.status}`,
      headers: {
        'Set-cookie': 'cookies',
        'Content-Type': 'application/json',
      },
      body: await response.text()
    };

  } catch (e) {
    if (isTimedoutError(e)) {
      return {
        isBase64Encoded: false,
        statusCode: 502,
        statusDescription: '502',
        headers: {
          'Set-cookie': 'cookies',
          'Content-Type': 'application/json',
        },
        body: null
      };
    } else {
      throw e
    }
  }

}
