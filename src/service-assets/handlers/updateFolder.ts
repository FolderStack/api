import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getParsedBody,
    getPathParam,
    validate,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/function';
import { number, object, string } from 'zod';
import { updateFolder } from '../lib/db/updateFolder';

async function updateFolderHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = getPathParam('folderId', event);
    const folderUpdate = validate(
        getParsedBody(event),
        object({
            image: string().optional(),
            fileSize: number().optional(),
            name: string().optional(),
            order: number().optional(),
        })
    );

    return pipe(
        updateFolder(folderId, folderUpdate, event.org.id),
        response(NoContent)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(updateFolderHandler));
