import {
    HttpBadRequestError,
    HttpInternalServerError,
} from '@common/errors';
import { Ok, response } from '@common/responses';
import { withSentryTrace } from '@common/sentry';
import { logger } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { pipe } from 'fp-ts/lib/function';
import { saveAttestationChallenge } from '../lib/db';

async function handler(event: APIGatewayProxyEvent) {
    try {
        const device = event.queryStringParameters?.device;
        const state = event.queryStringParameters?.state;

        if (!device || !state) {
            return new HttpBadRequestError().toResponse();
        }

        return pipe(
            saveAttestationChallenge(device, state),
            response((challenge) => Ok({ challenge }))
        )();
    } catch (err) {
        logger.error(err);
        return new HttpInternalServerError().toResponse();
    }
}

export const tracedHandler = withSentryTrace(handler);
