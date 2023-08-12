import { HttpBadRequestError } from '@common/errors';
import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    parseBody,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { updateTreeOrderAsync } from '../lib/updateTreeOrder';

async function updateTreeOrderHandler(event: APIGatewayProxyEventWithOrg) {
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
            () => updateTreeOrderAsync(items, event.org.id),
            (e) => {
                console.log(e);
                return new Error(String(e));
            } // Handle the error case
        ) as any,
        response(NoContent)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(updateTreeOrderHandler));
