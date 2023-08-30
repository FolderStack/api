import { Ok, response } from '@common/responses';
import {
    logger,
    validate
} from '@common/utils';
import { pipe } from 'fp-ts/function';
import { object, string } from 'zod';
import { createFolder } from '../../lib/db';

interface CreateFolderInternalEvent {
    name: string;
    image?: string | null;
    parent?: string | null;
    orgId: string;
}

async function createFolderInternalHandler(event: CreateFolderInternalEvent) {
    const { name, image, parent, orgId } = validate(
        event,
        object({
            name: string(),
            image: string().optional().nullable(),
            parent: string().optional().nullable(),
            orgId: string()
        })
    );

    logger.debug('createFolderInternalHandler', { name, image, parent, orgId });
    return pipe(createFolder(name, image ?? null, parent ?? null, orgId), response(Ok))();
}

export const handler = createFolderInternalHandler;
