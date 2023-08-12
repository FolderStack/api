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
import _ from 'lodash';
import { createFile } from '../lib/db';

export async function createFileHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = _.get(event.pathParameters, 'folderId', null);
    if (!folderId || _.isEmpty(folderId)) {
        return new HttpBadRequestError().toResponse();
    }

    const parsedBody = pipe(
        event.body,
        parseBody as any,
        O.getOrElse(() => {
            throw new HttpBadRequestError();
        })
    );

    const { name, file, fileSize, fileType } = parsedBody;

    return pipe(
        createFile(name, file, fileSize, fileType, folderId, event.org.id),
        response(Created)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(createFileHandler));
