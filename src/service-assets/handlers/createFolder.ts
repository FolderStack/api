import {
    HttpBadRequestError,
    HttpError,
    HttpInternalServerError,
} from '@common/errors';
import { Created, response } from '@common/responses';
import { getOrgIdFromEvent, parseBody } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { createFolder } from '../lib/db';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const org = getOrgIdFromEvent(event);
        //logger.debug('Org: ' + org);

        const parsedBody = pipe(
            event.body,
            parseBody as any,
            O.getOrElse(() => {
                throw new HttpBadRequestError();
            })
        );

        const { name, image = null, parent = null } = parsedBody;

        return pipe(
            createFolder(name, image, parent, org),
            response(Created)
        )();
    } catch (err: any) {
        // console.log(err);
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError(err?.message).toResponse();
    }
}
