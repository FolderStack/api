import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getPathParam,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/lib/function';
import { getContentsOfFolder } from '../lib/db';

async function getFolderContentsHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = getPathParam('folderId', event);

    const filterFrom = getPathParam('from', event, true);
    const filterTo = getPathParam('to', event, true);
    const filterFileTypes = getPathParam('fileTypes', event, true);

    const sortBy = getPathParam('sortBy', event, true) ?? 'name';
    const sortDir = getPathParam('sort', event, true) ?? 'asc';

    const page = Number(getPathParam('page', event, true) ?? 1);
    const pageSize = Number(getPathParam('pageSize', event, true) ?? 20);

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
