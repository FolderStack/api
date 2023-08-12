import {
    HttpBadRequestError,
    HttpError,
    HttpInternalServerError,
} from '@common/errors';
import { NoContent, response } from '@common/responses';
import { getOrgIdFromEvent, parseBody } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { updateFolder } from '../lib/db/updateFolder';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const org = getOrgIdFromEvent(event);

        const folderId = _.get(event.pathParameters, 'folderId', null);
        if (!folderId || _.isEmpty(folderId)) {
            return new HttpBadRequestError().toResponse();
        }

        const parsedBody = pipe(
            event.body,
            parseBody as any,
            O.getOrElse(() => {
                throw new HttpBadRequestError();
            })
        );

        return pipe(
            updateFolder(folderId, parsedBody, org),
            response(NoContent)
        )();
    } catch (err: any) {
        //logger.warn({ err });
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError(err?.message).toResponse();
    }
}
