
export interface Dictionary { [key: string]: string }

export interface ProxyRequestPayload {
  headers: Dictionary
  params: Dictionary
  body?: string
  path: string
  method: string
}
