import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getParsedBody,
    validate,
    withErrorWrapper,
    withEtagWrapper,
    withOrgWrapper,
} from '@common/utils';
import archiver from 'archiver';
import { randomInt } from 'crypto';
import { pipe } from 'fp-ts/lib/function';
import { object, string } from 'zod';
import { zipFolder, zipSelection } from '../lib/archive';

async function getZipeFileHandler(event: APIGatewayProxyEventWithOrg) {
    const data = validate(
        getParsedBody(event),
        object({
            folderId: string(),
        }).or(
            object({
                fileIds: string().array(),
            })
        )
    );

    const archive = archiver('zip');
    const random = randomInt(1, 1000);

    const org = event.org.id;
    const randKey = `${Date.now()}.rand${random}`;
    const key = `downloads/${org}/${randKey}/Archive.zip`;

    const task =
        'fileIds' in data
            ? zipSelection(archive, key, data.fileIds, event.org.id)
            : zipFolder(archive, key, data.folderId, event.org.id);

    return pipe(task, response(Ok))();
}

export const handler = withErrorWrapper(
    withOrgWrapper(withEtagWrapper(getZipeFileHandler, 300))
);
