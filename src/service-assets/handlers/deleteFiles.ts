import {
    HttpBadRequestError,
    HttpError,
    HttpInternalServerError,
} from '@common/errors';
import { NoContent, response } from '@common/responses';
import { getOrgIdFromEvent, parseBody } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { deleteFile } from '../lib/db/deleteFile';

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

        const { ids } = parsedBody;

        return pipe(
            TE.right(ids),
            TE.chain(() => {
                if (Array.isArray(ids)) {
                    // We use TE.sequenceArray() to transform an array of TaskEithers into a single TaskEither
                    const deleteTasks = (ids as string[]).map((id) =>
                        deleteFile(id, folderId, org)
                    );
                    return pipe(
                        deleteTasks,
                        TE.sequenceArray,
                        TE.map(() => void 0) // maps all successful deletions to void 0
                    );
                }
                return TE.right(void 0);
            }),
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
