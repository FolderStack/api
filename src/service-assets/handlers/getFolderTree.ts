import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    withErrorWrapper,
    withEtagWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/lib/function';
import { getFolderTree } from '../lib/db/getFolderTree';

async function getFolderTreeHandler(event: APIGatewayProxyEventWithOrg) {
    return pipe(getFolderTree('ROOT', event.org.id), response(Ok))();
}

export const handler = withErrorWrapper(
    withOrgWrapper(withEtagWrapper(getFolderTreeHandler))
);
