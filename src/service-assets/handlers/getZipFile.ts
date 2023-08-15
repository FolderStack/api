import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getParsedBody,
    validate,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import archiver from 'archiver';
import { randomInt } from 'crypto';
import { pipe } from 'fp-ts/lib/function';
import { object, string } from 'zod';
import { zipFolder, zipSelection } from '../lib/archive';

async function getZipeFileHandler(event: APIGatewayProxyEventWithOrg) {
    const { folderId, fileIds } = validate(
        getParsedBody(event),
        object({
            folderId: string(),
            fileIds: string().array().nullable(),
        })
    );

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
