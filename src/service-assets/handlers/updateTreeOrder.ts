import { NoContent, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getParsedBody,
    validate,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { array, lazy, number, object, string } from 'zod';
import { updateTreeOrderAsync } from '../lib/updateTreeOrder';

const TreeItemSchema = object({
    id: string(),
    name: string(),
    order: number(),
    children: array(lazy((): any => TreeItemSchema)),
    parent: string().nullable(),
});

async function updateTreeOrderHandler(event: APIGatewayProxyEventWithOrg) {
    const { items } = validate(
        getParsedBody(event),
        object({
            items: TreeItemSchema.array(),
        })
    );

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
