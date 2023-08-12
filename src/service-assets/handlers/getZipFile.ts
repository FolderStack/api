import { HttpBadRequestError } from '@common/errors';
import { Ok, response } from '@common/responses';
import { getOrgIdFromEvent, parseBody } from '@common/utils';
import archiver from 'archiver';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomInt } from 'crypto';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import { zipFolder, zipSelection } from '../lib/archive';

export async function handler(event: APIGatewayProxyEvent) {
    const org = getOrgIdFromEvent(event);

    const parsedBody = pipe(
        event.body,
        parseBody as any,
        O.getOrElse(() => {
            throw new HttpBadRequestError();
        })
    );

    const { folderId, fileIds = null } = parsedBody;

    if (typeof folderId !== 'string') {
        return new HttpBadRequestError().toResponse();
    }

    if (fileIds !== null && !Array.isArray(fileIds)) {
        return new HttpBadRequestError().toResponse();
    }

    const archive = archiver('zip');
    const random = randomInt(1, 1000);
    const key = `/downloads/${org}/${folderId}/${Date.now()}.rand${random}/download.zip`;

    const task = fileIds
        ? zipSelection(archive, key, folderId, fileIds, org)
        : zipFolder(archive, key, folderId, org);

    return pipe(task, response(Ok))();
}
