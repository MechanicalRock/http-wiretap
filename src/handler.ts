import AbortController  from 'abort-controller';
import { ALBEvent, ALBResult } from 'aws-lambda';
import { isWebUri } from 'valid-url';

export const isValid = (proxyUrl: string):boolean => {
  return isWebUri(proxyUrl) !== undefined ;
}

export const isTimedoutError = (err) => {
  // return err instanceof ABORTERRO
  return err.toString().includes("aborted")
}

const controller = new AbortController()

export const sendProxy = async (event: ALBEvent): Promise<ALBResult> => {
  // const { path, headers: { ['x-forwarded-proto']: protocol, host }, httpMethod } = event
  const { httpMethod } = event

  const proxyUrl = process.env.PROXY_URL

  if(!isValid(proxyUrl)){
    throw new Error('process.env.PROXY_URL should be set to the downstream proxied URL')
  }

  const proxyTimeoutSeconds = Number(process.env.PROXY_TIMEOUT_SECONDS)

  setTimeout(() => {
    controller.abort()
  }, proxyTimeoutSeconds)

  try {
    const response = await fetch(proxyUrl, {
      // const response = await fetch(`${protocol}://${host}${path}`, {
      method: httpMethod,
      signal: controller.signal,
    })

    return {
      isBase64Encoded: false,
      statusCode: response.status,
      statusDescription: `${response.status}`,
      headers: {
        'Set-cookie': 'cookies',
        'Content-Type': 'application/json',
      },
      body: null
    };

  } catch(e) {
    if(isTimedoutError(e)) {
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
    }
  }

}
