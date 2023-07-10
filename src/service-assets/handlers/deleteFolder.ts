import {
    HttpBadRequestError,
    HttpError,
    HttpInternalServerError,
} from '@common/errors';
import { NoContent, response } from '@common/responses';
import { getOrgId, logger } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { deleteFolder } from '../lib/db';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const org = getOrgId(event);

        const folderId = _.get(event.pathParameters, 'folderId', null);
        if (!folderId || _.isEmpty(folderId)) {
            return new HttpBadRequestError().toResponse();
        }

        return pipe(deleteFolder(folderId, org), response(NoContent))();
    } catch (err: any) {
        logger.warn({ err });
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError(err?.message).toResponse();
    }
}
