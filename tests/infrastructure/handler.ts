import { APIGatewayProxyHandler, APIGatewayEvent } from 'aws-lambda';
import 'source-map-support/register';

const aResponse = (statusCode: number, body: string = "{}") => statusCode < 400 ? Promise.resolve({
  statusCode,
  body
}) : Promise.reject({
  statusCode,
  body,
})

export const getOk: APIGatewayProxyHandler = () => aResponse(200)

export const getCreated: APIGatewayProxyHandler = () => aResponse(201)

export const getNotFound: APIGatewayProxyHandler  = () => aResponse(404)

export const getServerError: APIGatewayProxyHandler  = () => aResponse(500)

export const getUnresponsive: APIGatewayProxyHandler = () => new Promise(done => {
  setTimeout(() => done({
    statusCode: 200,
    body: "{}"
  }), Number(process.env.DELAY_TIME_SECONDS) * 1000)
})

export const postRelayBack: APIGatewayProxyHandler = (event: APIGatewayEvent) => aResponse(201, JSON.stringify({
  headers: event.headers,
  params: event.pathParameters,
  body: event.body
}))
