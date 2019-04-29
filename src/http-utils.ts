import { isWebUri } from "valid-url";
import "isomorphic-fetch"

declare type HttpHeaders = { [header: string]: string }

export const isValidUrl = (proxyUrl: string): boolean => {
  return isWebUri(proxyUrl) !== undefined;
}

export const urlAndParams = (url: string, params: any) => {
  const paramStr = Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
  return `${url}?${paramStr}`
}

/**
 * Encodes the HTTPResponse headers into a { key: value } dict.
 * NOTE: header names are lower-case
 * @see https://stackoverflow.com/a/5259004/10450721
 * @param response The HTTPResponse
 */
export const encodeResponseHeaders = (response: Response): HttpHeaders => {
  const headers: HttpHeaders = {}
  response.headers.forEach((value, header) => {
    // `header` is the lower case version - performed in the `forEach`.
    // Ideally, preserving case would be preferable, to ensure no side effects
    // but according to the spec, header names are case insensitive.
    headers[header] = value
  })
  return headers
}

export const sanitiseHttpHeaders = (headers: HttpHeaders): HttpHeaders => {
  // Copying the Host header across produces SSL errors when lambda makes request to downstream service
  delete headers['host']
  return headers
}
