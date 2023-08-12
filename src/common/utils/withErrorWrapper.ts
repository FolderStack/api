import { HttpError, HttpInternalServerError } from '@common/errors';
import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Callback,
    Context,
} from 'aws-lambda';

export function withErrorWrapper<T extends APIGatewayProxyEvent>(
    fn: (
        event: T,
        context: Context,
        callback: Callback
    ) => Promise<APIGatewayProxyResult>
) {
    return async function handler(
        event: T,
        context: Context,
        callback: Callback
    ): Promise<APIGatewayProxyResult> {
        try {
            const result = await fn(event, context, callback);
            return result;
        } catch (err: any) {
            if (err instanceof HttpError) {
                return err.toResponse();
            }
            return new HttpInternalServerError(
                err?.message ?? 'Internal Server Error'
            ).toResponse();
        }
    };
}
