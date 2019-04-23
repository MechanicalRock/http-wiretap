import { ALBEvent, ALBResult } from 'aws-lambda';
import { isWebUri } from 'valid-url';

export const isValid = (proxyUrl: string):boolean => {
  return isWebUri(proxyUrl) !== undefined ;
}

export const sendProxy = async (event: ALBEvent): Promise<ALBResult> => {
  // const { path, headers: { ['x-forwarded-proto']: protocol, host }, httpMethod } = event
  const { httpMethod } = event

  const proxyUrl = process.env.PROXY_URL
  if(!isValid(proxyUrl)){
    throw new Error('process.env.PROXY_URL should be set to the downstream proxied URL')
  }

  const response = await fetch(proxyUrl, {
  // const response = await fetch(`${protocol}://${host}${path}`, {
    method: httpMethod,
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
}
