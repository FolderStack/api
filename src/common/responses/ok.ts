import { APIGatewayProxyResult } from 'aws-lambda';

export function Ok(data?: any): APIGatewayProxyResult {
    return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
    };
}
