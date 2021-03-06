import { defineFeature, loadFeature } from "jest-cucumber"
import "isomorphic-fetch"
import { proxyHost, serviceEndpoints } from "./config"

// When we warm lambdas behind a VPC, they usually have a ~20 sec cold start
jest.setTimeout(30000)

const feature = loadFeature("cucumber/features/proxying.feature")

const runTimedCallback = async (cb: () => Promise<Response>) => {
  const startTime = Date.now()
  const response = await cb()

  return {
    elapsedTime: Date.now() - startTime,
    response
  }
}

const warmDownstreamServiceLambdas = () => Promise.all([
  fetch(serviceEndpoints.GET["200"], { method: 'GET'  }),
  fetch(serviceEndpoints.GET["404"], { method: 'GET'  }),
  fetch(serviceEndpoints.GET["200_SLOW_REPLY"], { method: 'GET'  }),
  fetch(serviceEndpoints.GET["200_FIXED_BODY"], { method: 'GET'  }),
  fetch(serviceEndpoints.POST["201"], { method: 'POST', body: "{}"  }),
  fetch(serviceEndpoints.POST["500"], { method: 'POST', body: "{}"  }),
  fetch(serviceEndpoints.POST["201_RELAY_BACK"], { method: 'POST', body: "{}"  })
])

defineFeature(feature, scenario => {
  let endpoint: string
  let response: Response
  let proxyRequestTimeMillis: number

  beforeAll(async() => {
    await warmDownstreamServiceLambdas()
  })

  scenario('Response bodies are returned upstream', ({ given, when, then, and }) => {
    given('the downstream service shall respond with a response body', async () => {
      endpoint = serviceEndpoints.GET['200_FIXED_BODY']
    })

    when('the client sends a request to the proxy', async () => {
      response = await fetch(endpoint, { method: "GET" })
    })

    then('the client should receive the response body from the downstream service', async () => {
      expect(response.body).toBeDefined()
      expect(await response.json()).toEqual({"firstName": "John", "lastName": "Doe"})
    })

    and('the client should receive the response headers from the downstream service', () => {
      expect(response.headers).toBeDefined()
      expect(response.headers.get('whoami')).toEqual('John Doe')
    })
  })

  scenario('The downstream service fails to respond', ({ given, and, when, then }) => {
    given('the downstream service shall not respond', () => {
      endpoint = serviceEndpoints.GET["200_SLOW_REPLY"]
    })

    and(/^the proxy timeout is configured to (.*) second$/, async (proxyTimeoutSecs: string) => {
      // Lambda already configured to same time or find way to configure dynamically as we need creds to invoke AWS sdk
      proxyTimeoutSecs
    })

    when('the client send a request to the proxy', async () => {
      const result = await runTimedCallback(() => fetch(endpoint, { method: 'GET' }))
      response = result.response
      proxyRequestTimeMillis = result.elapsedTime
    })

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.status).toBe(Number(statusCode))
    })

    and(/^the proxy should return within (.*) seconds$/, (elapsedTime: string) => {
      expect(proxyRequestTimeMillis).toBeLessThan(Number(elapsedTime) * 1000)
    })
  })

  scenario('Host header is not directly copied into requests downstream', ({ when, but, then }) => {
    let downstreamResponse: any

    when('the client send a request to the proxy', async () => {
      response = await fetch(`${serviceEndpoints.POST["201_RELAY_BACK"]}`, {
        method: "POST",
        headers: {
          'host': 'joesdiner.com',
          'etag': '17344',
        },
        body: "{}"
      })

      downstreamResponse = await response.json()
    })

    then('the request headers should be received by the downstream service', () => {
      expect(downstreamResponse.headers).toBeDefined()
      expect(downstreamResponse.headers.etag).toEqual('17344')
    })

    but('the host header should should not match the client request', () => {
      expect(downstreamResponse.headers.host).not.toBe("joesdiner.com")
    })
  })

  scenario('Transparent proxying of requests downstream', ({ when, then, and }) => {
    let downstreamResponse: any

    when('the client send a request to the proxy', async () => {
      // This endpoint just spits back the original request's body, header and query back to caller

      response = await fetch(`${serviceEndpoints.POST["201_RELAY_BACK"]}?limit=1000&ttl=40`, {
        method: "POST",
        headers: {
          'accept-type': 'application/json',
          'content-type': 'application/json'
        },
        body: '{"firstName": "Tom", "lastName": "Jones"}'
      })

      downstreamResponse = await response.json()
    })

    then('the request body should be received by the downstream service', async () => {
      expect(downstreamResponse.body).toBeDefined()
      expect(downstreamResponse.body).toEqual('{"firstName": "Tom", "lastName": "Jones"}')
    })

    and('the request headers should be received by the downstream service', () => {
      expect(downstreamResponse.headers).toBeDefined()
      expect(downstreamResponse.headers["accept-type"]).toBe('application/json')
      expect(downstreamResponse.headers["content-type"]).toBe('application/json')

      // API Gateway headers seem to be in upper case
      expect(downstreamResponse.headers["Host"]).not.toBe(proxyHost)
    })

    and('the request parameters should be received by the downstream service', () => {
      expect(downstreamResponse.params).toBeDefined()
      expect(downstreamResponse.params).toEqual({
        limit: '1000',
        ttl: '40'
      })
    })

    and('the request path should be received by the downstream service', () => {
      expect(downstreamResponse.path).toEqual('/downstream/relay-back')
    })
  })

  scenario('Responses are returned from downstream', ({ given, when, then }) => {
    let cannedStatusCode: string

    given(/^the downstream service shall return (\d+)$/, async (statusCode: string) => {
      cannedStatusCode = statusCode
    })

    when(/^the client sends (.*) a request to the proxy$/, async (method: string) => {
      // use fetch to call endpoint with method
      response = await fetch(`${serviceEndpoints[method][cannedStatusCode]}`, {
        method,
        body: '{}'
      })
    })

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.status).toBe(Number(statusCode))
    })
  })

})
