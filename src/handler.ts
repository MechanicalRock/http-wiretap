import { APIGatewayProxyHandler } from 'aws-lambda';

export const hello: APIGatewayProxyHandler = async (event, context) => {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    statusDescription: '200 OK',
    headers: {
      'Set-cookie': 'cookies',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Good Morning',
    }),
  };
}
