import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getParsedBody,
    getPathParam,
    validate,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { object, string } from 'zod';
import { deleteFile } from '../lib/db/deleteFile';

async function deleteFilesHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = getPathParam('folderId', event);

    const { ids } = validate(
        getParsedBody(event),
        object({
            ids: string().array(),
        })
    );

    return pipe(
        TE.right(ids),
        TE.chain(() => {
            // We use TE.sequenceArray() to transform an array of TaskEithers into a single TaskEither
            const deleteTasks = ids.map((id) =>
                deleteFile(id, folderId, event.org.id)
            );
            return pipe(
                deleteTasks,
                TE.sequenceArray,
                TE.map(() => void 0) // maps all successful deletions to void 0
            );
        }),
        response(NoContent)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(deleteFilesHandler));
