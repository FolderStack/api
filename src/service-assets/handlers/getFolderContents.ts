import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    getPathParam,
    getQueryParam,
    logger,
    withErrorWrapper,
    withEtagWrapper,
    withOrgWrapper,
} from '@common/utils';
import { pipe } from 'fp-ts/lib/function';
import { getContentsOfFolder } from '../lib/db';

async function getFolderContentsHandler(event: APIGatewayProxyEventWithOrg) {
    const folderId = getPathParam('folderId', event);

    const filterFrom = getQueryParam('from', event, true);
    const filterTo = getQueryParam('to', event, true);
    const filterFileTypes = getQueryParam('fileTypes', event, true);

    const sortBy = getQueryParam('sortBy', event, true) ?? 'name';
    const sortDir = getQueryParam('sort', event, true) ?? 'asc';

    const page = Number(getQueryParam('page', event, true) ?? 1);
    const pageSize = Number(getQueryParam('pageSize', event, true) ?? 20);

    logger.debug('getFolderContentsHandler', {
        folderId,
        filterFrom,
        filterTo,
        filterFileTypes,
        sortBy,
        sortDir,
        page,
        pageSize,
    });

    return pipe(
        getContentsOfFolder({
            folderId,
            orgId: event.org.id,
            filter: {
                from: filterFrom,
                to: filterTo,
                fileTypes: filterFileTypes?.split?.(','),
            },
            sort: {
                by: sortBy,
                order: sortDir,
            },
            pagination: {
                page,
                pageSize: 200, //Number.isNaN(pageSize) ? 200 : pageSize,
            },
        }),
        response(Ok)
    )();
}

export const handler = withErrorWrapper(
    withOrgWrapper(withEtagWrapper(getFolderContentsHandler, 300))
);
