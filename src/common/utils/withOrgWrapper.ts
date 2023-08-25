import { HttpUnauthorizedError } from '@common/errors';
import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Callback,
    Context,
} from 'aws-lambda';
import { getOrgFromEvent } from './getOrdId';
import { logger } from './logger';

type Organisation = Record<string, any>;

export type APIGatewayProxyEventWithOrg = APIGatewayProxyEvent & {
    org: Organisation;
};

export function withOrgWrapper(
    fn: (
        event: APIGatewayProxyEventWithOrg,
        context: Context,
        callback: Callback
    ) => Promise<APIGatewayProxyResult>
) {
    return async function handler(
        event: APIGatewayProxyEventWithOrg,
        context: Context,
        callback: Callback
    ): Promise<APIGatewayProxyResult> {
        const org = await getOrgFromEvent(event);

        if (!org) {
            logger.debug('Failed to get org, throwing Unauthorized.');
            throw new HttpUnauthorizedError();
        }

        logger.debug('Got org', org);
        event.org = org;

        const result = await fn(event, context, callback);
        return result;
    };
}
