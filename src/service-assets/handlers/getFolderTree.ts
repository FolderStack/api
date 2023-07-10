import { Ok, response } from '@common/responses';
import { getOrgId } from '@common/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { pipe } from 'fp-ts/lib/function';
import { getFolderTree } from '../lib/db/getFolderTree';

export async function handler(event: APIGatewayProxyEvent) {
    const org = getOrgId(event);
    return pipe(getFolderTree('ROOT', org), response(Ok))();
}
