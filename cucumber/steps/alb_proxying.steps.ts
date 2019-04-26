import { defineFeature, loadFeature } from "jest-cucumber"
import "isomorphic-fetch"

jest.setTimeout(30000)

const feature = loadFeature("cucumber/features/proxying.feature")
const proxyBaseUrl = "wiret-albSe-1VGDWATE2HD2B-1913174424.us-east-1.elb.amazonaws.com:5050"
const serviceEndpoints = {
  GET: {
    "200": `${proxyBaseUrl}/downstream/ok`,
    "404": `${proxyBaseUrl}/downstream/not-found`,
    "200_SLOW_REPLY": `${proxyBaseUrl}/downstream/slow-reply`,
  },

  POST: {
    "201": `${proxyBaseUrl}/downstream/created`,
    "500": `${proxyBaseUrl}/downstream/server-error`,
    "201_RELAY_BACK": `${proxyBaseUrl}/downstream/relay-back`
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
  fetch(serviceEndpoints.GET[200], { method: 'GET'  }),
  fetch(serviceEndpoints.GET["200_SLOW_REPLY"], { method: 'GET'  }),
  fetch(serviceEndpoints.GET[404], { method: 'GET'  }),
  fetch(serviceEndpoints.POST[201], { method: 'POST', body: "{}"  }),
  fetch(serviceEndpoints.POST[500], { method: 'POST', body: "{}"  }),
  fetch(serviceEndpoints.POST["201_RELAY_BACK"], { method: 'POST', body: "{}"  })
])

defineFeature(feature, scenario => {
  let endpoint: string
  let response: Response
  let proxyRequestTimeMillis: number

  beforeAll(async() => {
    await warmDownstreamServiceLambdas()
  })

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
      response = await fetch(`${serviceEndpoints.POST["201_RELAY_BACK"]}?limit=1000&ttl=40`, {
        method: "POST",
        headers: {
          authorization: 'ABC-123',
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

    and('the request headers should be received by the downstream service', () => {
      expect(responseData.headers).toBeDefined()
      expect(responseData.headers).toEqual({
        authorization: 'ABC-123',
        'content-type': 'application/json'
      })
    });

    and('the request parameters should be received by the downstream service', () => {
      expect(responseData.params).toBeDefined()
      expect(responseData.params).toEqual({
        limit: '1000',
        ttl: '40'
      })
    });

    and('the request path should be received by the downstream service', () => {
      expect(responseData.path).toEqual({
        path: '/downstream/relay-back'
      })
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
