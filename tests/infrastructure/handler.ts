import { APIGatewayProxyHandler, APIGatewayEvent } from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from "aws-sdk"
import { v4}  from "uuid"
import * as moment from 'moment';

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

export const captureRequest: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  const db = new AWS.DynamoDB.DocumentClient()

  await db.put({
    TableName: 'ServiceTable',
    Item: {
      id: v4(),
      created: moment().format("MM/DD/YYYY HH:mm:ss"),
      message: event.body
    }
  }).promise()

  return aResponse(201)
}

export const getCapturedRequests: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  const db = new AWS.DynamoDB.DocumentClient()
  const response = await db.scan({
    TableName: 'ServiceTable'
  }).promise()

  return aResponse(200, JSON.stringify(response.Items))
}

