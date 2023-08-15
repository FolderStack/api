import { Created, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getParsedBody,
    validate,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/function';
import { object, string } from 'zod';
import { createFolder } from '../lib/db';

export async function createFolderHandler(event: APIGatewayProxyEventWithOrg) {
    const { name, image, parent } = validate(
        getParsedBody(event),
        object({
            name: string(),
            image: string().optional().nullable(),
            parent: string().optional().nullable(),
        })
    );

    return pipe(
        createFolder(name, image ?? null, parent ?? null, event.org.id),
        response(Created)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(createFolderHandler));
