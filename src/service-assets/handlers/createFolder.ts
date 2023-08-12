import { HttpBadRequestError } from '@common/errors';
import { Created, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    parseBody,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { createFolder } from '../lib/db';

export async function createFolderHandler(event: APIGatewayProxyEventWithOrg) {
    const parsedBody = pipe(
        event.body,
        parseBody as any,
        O.getOrElse(() => {
            throw new HttpBadRequestError();
        })
    );

    const { name, image = null, parent = null } = parsedBody;

    return pipe(
        createFolder(name, image, parent, event.org.id),
        response(Created)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(createFolderHandler));
