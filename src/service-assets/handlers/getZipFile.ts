import { HttpBadRequestError } from '@common/errors';
import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    parseBody,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import archiver from 'archiver';
import { randomInt } from 'crypto';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import { zipFolder, zipSelection } from '../lib/archive';

async function getZipeFileHandler(event: APIGatewayProxyEventWithOrg) {
    const parsedBody = pipe(
        event.body,
        parseBody as any,
        O.getOrElse(() => {
            throw new HttpBadRequestError();
        })
    );

    const { folderId, fileIds = null } = parsedBody;

    if (typeof folderId !== 'string') {
        throw new HttpBadRequestError();
    }

    if (fileIds !== null && !Array.isArray(fileIds)) {
        throw new HttpBadRequestError();
    }

    const archive = archiver('zip');
    const random = randomInt(1, 1000);
    const key = `/downloads/${
        event.org.id
    }/${folderId}/${Date.now()}.rand${random}/download.zip`;

    const task = fileIds
        ? zipSelection(archive, key, folderId, fileIds, event.org.id)
        : zipFolder(archive, key, folderId, event.org.id);

    return pipe(task, response(Ok))();
}

export const handler = withErrorWrapper(withOrgWrapper(getZipeFileHandler));
