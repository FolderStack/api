import {
    HttpBadRequestError,
    HttpError,
    HttpInternalServerError,
} from '@common/errors';
import { NoContent, response } from '@common/responses';
import { getOrgId, logger, parseBody } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { updateTreeOrder } from '../lib/updateTreeOrder';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const org = getOrgId(event);

        const parsedBody = pipe(
            event.body,
            parseBody as any,
            O.getOrElse(() => {
                throw new HttpBadRequestError();
            })
        );

        const { items } = parsedBody;

        return pipe(updateTreeOrder(items, org), response(NoContent))();
    } catch (err: any) {
        logger.warn({ err });
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError(err?.message).toResponse();
    }
}
