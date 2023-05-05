import { APIGatewayProxyEvent } from 'aws-lambda';
import { pipe } from 'fp-ts/lib/function';
import { Ok, logger, response, withSentryTrace } from '../../common';
import {
    HttpBadRequestError,
    HttpInternalServerError,
} from '../../common/errors';
import { createAndStoreChallenge } from '../lib/createAndStoreChallenge';

async function handler(event: APIGatewayProxyEvent) {
    try {
        const device = event.queryStringParameters?.device;
        const state = event.queryStringParameters?.state;

        if (!device || !state) {
            return new HttpBadRequestError().toResponse();
        }

        return pipe(
            createAndStoreChallenge(device, state),
            response((challenge) => Ok({ challenge }))
        )();
    } catch (err) {
        logger.error(err);
        return new HttpInternalServerError().toResponse();
    }
}

export const tracedHandler = withSentryTrace(handler);
