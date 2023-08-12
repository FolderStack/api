import { HttpBadRequestError } from '@common/errors';
import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/lib/function';
import _ from 'lodash';
import { getContentsOfFolder } from '../lib/db';

async function getFolderContentsHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = _.get(event, 'pathParameters.folderId', null);
    if (!folderId) throw new HttpBadRequestError();

    const params = event.queryStringParameters;

    const filterFrom = _.get(params, 'from');
    const filterTo = _.get(params, 'to');
    const filterFileTypes = _.get(params, 'fileTypes');

    let sortBy = _.get(params, 'sortBy', 'name');
    let sortDir = _.get(params, 'sort', 'asc');

    const page = Number(_.get(params, 'page', 1));
    const pageSize = Number(_.get(params, 'pageSize', 20));

    return pipe(
        getContentsOfFolder({
            folderId,
            orgId: event.org.id,
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
                page,
                pageSize: Number.isNaN(pageSize) ? 20 : pageSize,
            },
        }),
        response(Ok)
    )();
}

export const handler = withErrorWrapper(
    withOrgWrapper(getFolderContentsHandler)
);
