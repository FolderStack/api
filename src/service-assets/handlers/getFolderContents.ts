import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpBadRequestError } from '@common/errors';
import { Ok, response } from '@common/responses';
import { dynamoDb, getOrgId } from '@common/utils';
import { config } from '@config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { pipe } from 'fp-ts/lib/function';
import _ from 'lodash';
import { getContentsOfFolder } from '../lib/db';

export async function handler(event: APIGatewayProxyEvent) {
    const orgId = getOrgId(event);

    const folderId = _.get(event, 'pathParameters.folderId', null);
    if (!folderId) {
        return new HttpBadRequestError().toResponse();
    }

    const params = event.queryStringParameters;

    const filterFrom = _.get(params, 'from');
    const filterTo = _.get(params, 'to');
    const filterFileTypes = _.get(params, 'fileTypes');

    let sortBy = _.get(params, 'sortBy', 'name');
    let sortDir = _.get(params, 'sort', 'asc');

    const pageSize = Number(_.get(params, 'pageSize', 20));
    const cursor = _.get(params, 'cursor');

    const cmd = new ScanCommand({
        TableName: config.tables.assetTable,
    });
    const result = await dynamoDb.send(cmd);
    console.log(result.Items?.map((item) => unmarshall(item)));

    return pipe(
        getContentsOfFolder({
            folderId,
            orgId,
            filter: {
                from: filterFrom,
                to: filterTo,
                fileTypes: filterFileTypes?.split(','),
            },
            sort: {
                by: sortBy,
                order: sortDir,
            },
            pagination: {
                pageSize: Number.isNaN(pageSize) ? 20 : pageSize,
                cursor,
            },
        }),
        response(Ok)
    )();
}
