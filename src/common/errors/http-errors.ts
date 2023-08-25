import { APIGatewayProxyResult } from 'aws-lambda';

export class HttpError extends Error {
    constructor(
        public readonly statusCode = 500,
        public readonly error = 'Internal Server Error',
        public readonly error_description?: any,
        public readonly extra?: any
    ) {
        super(
            JSON.stringify({
                error,
                error_code: statusCode,
                error_description,
                error_details: extra,
            })
        );
    }

    toResponse(): APIGatewayProxyResult {
        return {
            statusCode: this.statusCode,
            body: JSON.stringify({
                error: this.error,
                error_code: this.statusCode,
                error_description: this.error_description,
                error_details: this.extra,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers':
                    'Content-Type,X-Amz-Date,Authorization,X-Amz-Security-Token,X-Amz-User-Agent,X-Csrf',
            },
        };
    }
}
