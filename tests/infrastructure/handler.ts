import { APIGatewayProxyHandler, APIGatewayEvent } from 'aws-lambda';
import 'source-map-support/register';

const aResponse = (statusCode: number, body: string = "{}", headers: {[header: string]: string} = {}) => Promise.resolve({ statusCode, body, headers })

export const getOk: APIGatewayProxyHandler = () => aResponse(200, "All good!")

export const postCreated: APIGatewayProxyHandler = () => aResponse(201, "Created resource")

export const getNotFound: APIGatewayProxyHandler  = () => aResponse(404, "Oops, not found")

export const postServerError: APIGatewayProxyHandler  = () => aResponse(500, "Oops error occured in server!")

export const getSlowReply: APIGatewayProxyHandler = () => new Promise(done => {
  setTimeout(() => done({
    statusCode: 200,
    body: "Responded after a long time processing stuff..."
  }), 20000)
})

export const getFixedBody: APIGatewayProxyHandler = () => aResponse(200, JSON.stringify({
  firstName: "John",
  lastName: "Doe"
}), {
  whoami: 'John Doe'
})

export const postRelayBack: APIGatewayProxyHandler = (event: APIGatewayEvent) => aResponse(201, JSON.stringify({
  headers: event.headers,
  params: event.queryStringParameters,
  path: event.path,
  body: event.body
}))
