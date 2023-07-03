import {
    HttpBadRequestError,
    HttpError,
    HttpInternalServerError,
} from '@common/errors';
import { Created, response } from '@common/responses';
import { getOrgId, logger, parseBody } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { createFile } from '../lib/db';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const org = getOrgId(event);

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

        const { name, file, fileSize, fileType } = parsedBody;

        return pipe(
            createFile(name, file, fileSize, fileType, folderId, org),
            response(Created)
        )();
    } catch (err: any) {
        logger.warn({ err });
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError(err?.message).toResponse();
    }
}
