import { Ok, response } from '@common/responses';
import {
    validate,
    withErrorWrapper
} from '@common/utils';
import { pipe } from 'fp-ts/function';
import { number, object, string } from 'zod';
import { updateFile } from '../../lib/db/updateFile';

interface UpdateFileInternalEvent {
    fileId: string;
    folderId: string;
    orgId: string;
    name?: string;
    file?: string;
    fileSize?: number;
    fileType?: string;
}

async function updateFileInternalHandler(event: UpdateFileInternalEvent) {
    const { fileId, folderId, orgId, ...changes } = validate(
        event,
        object({
            fileId: string(),
            folderId: string(),
            name: string().optional(),
            file: string().optional(),
            fileSize: number().optional(),
            fileType: string().optional(),
            orgId: string()
        })
    );

    return pipe(
        updateFile(fileId, folderId, changes, orgId),
        response(Ok)
    )();
}

export const handler = withErrorWrapper(updateFileInternalHandler);
