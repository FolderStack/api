import { Created, response } from '@common/responses';
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
import { createFile } from '../lib/db';

export async function createFileHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = getPathParam('folderId', event);

    const { name, file, fileSize, fileType } = validate(
        getParsedBody(event),
        object({
            name: string(),
            file: string(),
            fileSize: number(),
            fileType: string(),
        })
    );

    return pipe(
        createFile(name, file, fileSize, fileType, folderId, event.org.id),
        response(Created)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(createFileHandler));
