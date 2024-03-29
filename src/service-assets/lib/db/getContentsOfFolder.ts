import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { HttpNotFoundError } from '@common/errors';
import { logger, sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { fromFileRecordToJsonWithSignedImageUrls } from '../fromFileRecordToJson';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFile, IFileRecord, IFolder, IFolderRecord } from '../type';
import { getFolder } from './getFolder';

interface Parameters {
    folderId: string;
    orgId: string;
    pagination: {
        page: number;
        pageSize: number;
    };
    sort: {
        by: string;
        order: string;
    };
    filter: {
        from?: string;
        to?: string;
        fileTypes?: string[];
    };
}

interface Result {
    data: {
        current: IFolder | null;
        items: readonly (IFile | IFolder)[];
    };
    pagination: {
        totalItems: number;
        found: number;
        pageSize: number;
        nextCursor?: string;
    };
}

// Utility function to check if a date is valid
function isValidDate(d: Date) {
    return !isNaN(d as any);
}

export function getContentsOfFolder(
    params: Parameters
): TE.TaskEither<Error, Result> {
    let attributeValues: any = {
        ':parentId': `Folder#${params.folderId}`,
    };
    let filterExpressions: string[] = [];
    const { filter } = params;

    const fromDate = new Date(filter.from as any);
    if (filter.from && isValidDate(fromDate)) {
        attributeValues[':fromDate'] = fromDate.getTime();
        filterExpressions.push('createdAt >= :fromDate');
    }

    const toDate = new Date(filter.to as any);
    if (filter.to && isValidDate(toDate)) {
        attributeValues[':toDate'] = toDate.getTime();
        filterExpressions.push('createdAt <= :toDate');
    }

    if (filter.fileTypes && filter.fileTypes.length > 0) {
        filter.fileTypes.forEach((fileType, index) => {
            attributeValues[`:fileType${index}`] = fileType;
        });
        filterExpressions.push(
            `fileType IN (${filter.fileTypes
                .map((_, index) => `:fileType${index}`)
                .join(', ')})`
        );
    }

    const query: QueryCommandInput = {
        TableName: config.tables.table,
        IndexName: `${params.sort.by}Index`,
        KeyConditionExpression: `PK = :parentId`,
        ExpressionAttributeValues: marshall(attributeValues),
        FilterExpression: filterExpressions.length
            ? filterExpressions.join(' and ')
            : undefined,
        Limit: params.pagination.pageSize,
        ScanIndexForward: params.sort.order === 'asc',
    };

    logger.debug('getContentsOfFolder', { query });

    return pipe(
        getFolder(params.folderId, params.orgId),
        TE.chain((folder) => {
            logger.debug('folder', { folder });
            if (!folder) {
                return TE.left(new HttpNotFoundError());
            }
            return TE.right(folder);
        }),
        TE.chain((folder) => {
            return pipe(
                new QueryCommand(query),
                sendReadCommand<IFolderRecord | IFileRecord>,
                TE.map((results) => {
                    // When page is 1, first index is 0
                    // When page is 2, first index is 20 (assuming pageSize is 20)
                    const firstIndex =
                        (params.pagination.page - 1) *
                        params.pagination.pageSize;

                    // When page is 1, last index is 9
                    // When page is 2, last index is 19
                    const lastIndex =
                        params.pagination.page * params.pagination.pageSize;

                    const sliced = results.slice(
                        firstIndex,
                        Math.min(results.length, lastIndex)
                    );

                    return sliced
                        .map((r) => {
                            if (r.org !== params.orgId) return null;
                            if (r.entityType === 'File') {
                                logger.debug('got file', { file: r });
                                return pipe(
                                    TE.tryCatch(
                                        () =>
                                            fromFileRecordToJsonWithSignedImageUrls(
                                                r
                                            ),
                                        (err) =>
                                            new Error(
                                                err instanceof Error
                                                    ? err.message
                                                    : 'Unknown error'
                                            )
                                    ),
                                    TE.map(O.fromNullable),
                                    TE.chain(
                                        TE.fromOption(
                                            () => new Error('File not found')
                                        )
                                    )
                                );
                            } else if (r.entityType === 'Folder') {
                                logger.debug('got folder', { folder: r });
                                return pipe(
                                    O.fromNullable(fromFolderRecordToJson(r)),
                                    TE.fromOption(
                                        () => new Error('Folder not found')
                                    )
                                );
                            }
                        })
                        .filter((a) => a !== null) as TE.TaskEither<
                        Error,
                        IFile | IFolder
                    >[];
                }),
                TE.chain((itemsTaskEither) =>
                    TE.sequenceArray(itemsTaskEither)
                ),
                TE.map((result) => {
                    return {
                        current: folder,
                        items: result,
                    };
                })
            );
        }),
        TE.map(({ current, items }) => {
            return {
                data: { current, items },
                pagination: {
                    totalItems: current?.itemCount ?? -1,
                    found: items.length,
                    page: params.pagination.page,
                    pageSize: params.pagination.pageSize,
                },
            };
        })
    );
}
