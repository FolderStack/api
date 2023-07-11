import {
    HttpBadRequestError,
    HttpError,
    HttpInternalServerError,
} from '@common/errors';
import { NoContent, response } from '@common/responses';
import { getOrgId, parseBody } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { updateTreeOrderAsync } from '../lib/updateTreeOrder';

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const org = getOrgId(event);

        const parsedBody = pipe(
            event.body,
            parseBody as any,
            O.getOrElse(() => {
                throw new HttpBadRequestError();
            })
        );

        const { items } = parsedBody;

        return pipe(
            TE.tryCatch(
                () => updateTreeOrderAsync(items, org),
                (e) => {
                    console.log(e);
                    return new Error(String(e));
                } // Handle the error case
            ) as any,
            response(NoContent)
        )();
    } catch (err: any) {
        // console.log(err);
        // //logger.warn({ err });
        if (err instanceof HttpError) {
            return err.toResponse();
        }
        return new HttpInternalServerError(err?.message).toResponse();
    }
}
