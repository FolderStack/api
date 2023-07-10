import { APIGatewayProxyResult } from 'aws-lambda';

export function NoContent(): APIGatewayProxyResult {
    return {
        statusCode: 204,
        body: '',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
    };
}
