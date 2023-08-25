import { APIGatewayProxyResult } from 'aws-lambda';

export function NoContent(): APIGatewayProxyResult {
    return {
        statusCode: 204,
        body: '',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers':
                'Content-Type,X-Amz-Date,Authorization,X-Amz-Security-Token,X-Amz-User-Agent,X-Csrf',
        },
    };
}
