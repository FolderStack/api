import { Created, response } from '@common/responses';
import {
    validate,
    withErrorWrapper
} from '@common/utils';
import { pipe } from 'fp-ts/function';
import { number, object, string } from 'zod';
import { createFile } from '../../lib/db';

interface CreateFileInternalEvent {
    name: string;
    file: string;
    fileSize: number;
    fileType: string;

    folderId: string;
    orgId: string;
}

async function createFileInternalHandler(event: CreateFileInternalEvent) {
    const { name, file, fileSize, fileType, folderId, orgId } = validate(
        event,
        object({
            name: string(),
            file: string(),
            fileSize: number(),
            fileType: string(),
            folderId: string(),
            orgId: string()
        })
    );

    return pipe(
        createFile(name, file, fileSize, fileType, folderId, orgId),
        response(Created)
    )();
}

export const handler = withErrorWrapper(createFileInternalHandler);
