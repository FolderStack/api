import { APIGatewayProxyResult } from 'aws-lambda';

export function Created(data?: any): APIGatewayProxyResult {
    return {
        statusCode: 201,
        body: JSON.stringify(data),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
    };
}
