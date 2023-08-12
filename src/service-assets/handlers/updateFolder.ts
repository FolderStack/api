import { HttpBadRequestError } from '@common/errors';
import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    parseBody,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { updateFolder } from '../lib/db/updateFolder';

async function updateFolderHandler(event: APIGatewayProxyEventWithOrg) {
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

    return pipe(
        updateFolder(folderId, parsedBody, event.org.id),
        response(NoContent)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(updateFolderHandler));
