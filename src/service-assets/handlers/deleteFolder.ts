import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getPathParam,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/function';
import { deleteFolder } from '../lib/db';

async function deleteFolderHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = getPathParam('folderId', event);
    return pipe(deleteFolder(folderId, event.org.id), response(NoContent))();
}

export const handler = withErrorWrapper(withOrgWrapper(deleteFolderHandler));
