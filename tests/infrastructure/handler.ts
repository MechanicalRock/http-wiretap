import { APIGatewayProxyHandler, APIGatewayEvent } from 'aws-lambda';
import 'source-map-support/register';

const aResponse = (statusCode: number, body: string = "{}") => Promise.resolve({ statusCode, body })

export const getOk: APIGatewayProxyHandler = () => aResponse(200, "All good!")

export const postCreated: APIGatewayProxyHandler = () => aResponse(201, "Created resource")

export const getNotFound: APIGatewayProxyHandler  = () => aResponse(404, "Oops, not found")

export const postServerError: APIGatewayProxyHandler  = () => aResponse(500, "Oops error occured in server!")

export const getSlowReply: APIGatewayProxyHandler = () => new Promise(done => {
  setTimeout(() => done({
    statusCode: 200,
    body: "Responded after a long time processing stuff..."
  }), 10000)
})

export const postRelayBack: APIGatewayProxyHandler = (event: APIGatewayEvent) => aResponse(201, JSON.stringify({
  headers: event.headers,
  params: event.queryStringParameters,
  path: event.path,
  body: event.body
}))
