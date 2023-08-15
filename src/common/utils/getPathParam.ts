import { HttpBadRequestError } from '@common/errors';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { ZodError, object, string } from 'zod';
import { validate } from './validateObject';

export function getPathParam<T extends APIGatewayProxyEvent>(
    key: string,
    event: T,
    optional?: false | undefined
): string;
export function getPathParam<T extends APIGatewayProxyEvent>(
    key: string,
    event: T,
    optional: true
): string | undefined;
export function getPathParam<T extends APIGatewayProxyEvent>(
    key: string,
    event: T,
    optional: boolean = false
): string | undefined {
    try {
        const schema = object({
            [key]: optional ? string().optional() : string(),
        });

        const result = validate(event.pathParameters, schema);

        return result[key] as any;
    } catch (error) {
        if (error instanceof ZodError) {
            // Get the first error type and message
            const firstError = error.errors[0];

            let messageType = '';
            switch (firstError.code) {
                case 'invalid_type':
                    messageType = firstError.expected;
                    break;
                // Add other error types if you need to handle them
                default:
                    messageType = 'valid value'; // Default message, can be adjusted
            }

            // Use firstError.path to determine which field caused the error
            const fieldPath = firstError.path.join('.');
            const errorMessage = `Expected query parameter '${fieldPath}' to be a ${messageType}${
                'received' in firstError
                    ? `, received '${firstError.received}'`
                    : ''
            }`;

            throw new HttpBadRequestError(errorMessage);
        } else {
            // If the error is not a ZodError
            throw new HttpBadRequestError(`Failed to validate '${name}'`);
        }
    }
}
