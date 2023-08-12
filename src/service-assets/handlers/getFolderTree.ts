import { Ok, response } from '@common/responses';
import { getOrgIdFromEvent } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { pipe } from 'fp-ts/lib/function';
import { getFolderTree } from '../lib/db/getFolderTree';

export async function handler(event: APIGatewayProxyEvent) {
    const org = getOrgIdFromEvent(event);
    return pipe(getFolderTree('ROOT', org), response(Ok))();
}
