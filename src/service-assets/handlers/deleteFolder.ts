import { HttpBadRequestError } from '@common/errors';
import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { deleteFolder } from '../lib/db';

async function deleteFolderHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = _.get(event.pathParameters, 'folderId', null);
    if (!folderId || _.isEmpty(folderId)) {
        throw new HttpBadRequestError();
    }

    return pipe(deleteFolder(folderId, event.org.id), response(NoContent))();
}

export const handler = withErrorWrapper(withOrgWrapper(deleteFolderHandler));
