import { defineFeature, loadFeature } from "jest-cucumber"
import "isomorphic-fetch"

// When we warm lambdas behind a VPC, they usually have a ~20 sec cold start
jest.setTimeout(30000)

const feature = loadFeature("cucumber/features/proxying.feature")
const proxyHost = "wiret-albSe-1VGDWATE2HD2B-1913174424.us-east-1.elb.amazonaws.com"
const proxyPort = 5050
const serviceEndpoints = {
  GET: {
    "200": `http://${proxyHost}:${proxyPort}/downstream/ok`,
    "404": `http://${proxyHost}:${proxyPort}/downstream/not-found`,
    "200_SLOW_REPLY": `http://${proxyHost}:${proxyPort}/downstream/slow-reply`,
    "200_FIXED_BODY": `http://${proxyHost}:${proxyPort}/downstream/fixed-body`
  },

  POST: {
    "201": `http://${proxyHost}:${proxyPort}/downstream/created`,
    "500": `http://${proxyHost}:${proxyPort}/downstream/server-error`,
    "201_RELAY_BACK": `http://${proxyHost}:${proxyPort}/downstream/relay-back`
  }
}

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
    });

    when('the client sends a request to the proxy', async () => {
      response = await fetch(endpoint, { method: "GET" })
    });

    then('the client should receive the response body from the downstream service', async () => {
      expect(response.body).toBeDefined()
      expect(await response.json()).toEqual({"firstName": "John", "lastName": "Doe"})
    });

    and('the client should receive the response headers from the downstream service', () => {
      expect(response.headers).toBeDefined()
      expect(response.headers.get('whoami')).toEqual('John Doe')
    });
  });

  scenario('The downstream service fails to respond', ({ given, and, when, then }) => {
    given('the downstream service shall not respond', () => {
      endpoint = serviceEndpoints.GET["200_SLOW_REPLY"]
    });

    and(/^the proxy timeout is configured to (.*) second$/, async (proxyTimeoutSecs: string) => {
      // Lambda already configured to same time or find way to configure dynamically as we need creds to invoke AWS sdk
      proxyTimeoutSecs;
    });

    when('the client send a request to the proxy', async () => {
      const result = await runTimedCallback(() => fetch(endpoint, { method: 'GET' }));
      response = result.response
      proxyRequestTimeMillis = result.elapsedTime
    });

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.status).toBe(Number(statusCode))
    });

    and(/^the proxy should return within (.*) seconds$/, (elapsedTime: string) => {
      expect(proxyRequestTimeMillis).toBeLessThan(Number(elapsedTime) * 1000);
    });
  });

  scenario('Transparent proxying of requests downstream', ({ when, then, and }) => {
    let responseData: any

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

      responseData = await response.json()
    });

    then('the request body should be received by the downstream service', async () => {
      expect(responseData.body).toBeDefined()
      expect(responseData.body).toEqual('{"firstName": "Tom", "lastName": "Jones"}')
    });

    and('the request headers excluding the host should be received by the downstream service', () => {
      expect(responseData.headers).toBeDefined()
      expect(responseData.headers["accept-type"]).toBe('application/json')
      expect(responseData.headers["content-type"]).toBe('application/json')
      expect(responseData.headers["Host"]).not.toBe(proxyHost)
    });

    and('the request parameters should be received by the downstream service', () => {
      expect(responseData.params).toBeDefined()
      expect(responseData.params).toEqual({
        limit: '1000',
        ttl: '40'
      })
    });

    and('the request path should be received by the downstream service', () => {
      expect(responseData.path).toEqual('/downstream/relay-back')
    });
  });

  scenario('Responses are returned from downstream', ({ given, when, then }) => {
    let cannedStatusCode: string;

    given(/^the downstream service shall return (\d+)$/, async (statusCode: string) => {
      cannedStatusCode = statusCode
    });

    when(/^the client sends (.*) a request to the proxy$/, async (method: string) => {
      // use fetch to call endpoint with method
      response = await fetch(`${serviceEndpoints[method][cannedStatusCode]}`, {
        method,
        headers: {
          authorization: 'ABC-123',
          'content-type': 'application/json'
        },
        body: '{}'
      })
    });

    then(/^the proxy return code should be (\d+)$/, (statusCode: string) => {
      expect(response.status).toBe(Number(statusCode))
    });
  });

})
