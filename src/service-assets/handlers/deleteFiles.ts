import { HttpBadRequestError } from '@common/errors';
import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    parseBody,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { deleteFile } from '../lib/db/deleteFile';

async function deleteFilesHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = _.get(event.pathParameters, 'folderId', null);
    if (!folderId || _.isEmpty(folderId)) {
        throw new HttpBadRequestError();
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
                    deleteFile(id, folderId, event.org.id)
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
}

export const handler = withErrorWrapper(withOrgWrapper(deleteFilesHandler));
