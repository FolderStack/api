import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { logger, sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import _ from 'lodash';
import { fromFileRecordToJson } from '../fromFileRecordToJson';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFile, IFileRecord, IFolder, IFolderRecord } from '../type';

interface Parameters {
    folderId: string;
    orgId: string;
    pagination: {
        pageSize: number;
        cursor?: string;
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

export function getContentsOfFolder(
    params: Parameters
): TE.TaskEither<Error, (IFolder | IFile)[]> {
    logger.debug('Begin: getContentsOfFolder');
    console.log(JSON.stringify(params, null, 4));

    let attributeValues: any = {
        ':folderId': `Folder#${params.folderId}`,
    };
    let filterExpressions: string[] = [];

    const { filter } = params;
    if (!_.isEmpty(filter.from) && !_.isNaN(new Date(filter.from as any))) {
        attributeValues[':fromDate'] = params.filter.from;
        filterExpressions.push('createdAt >= :fromDate');
    }

    if (!_.isEmpty(filter.to) && !_.isNaN(new Date(filter.to as any))) {
        attributeValues[':toDate'] = params.filter.to;
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

    // filterExpressions.push('begins_with(PK, :folderId)');

    const query: QueryCommandInput = {
        TableName: config.tables.assetTable,
        // IndexName: `${params.sort.by}Index`,
        KeyConditionExpression: 'PK = :folderId',
        ExpressionAttributeValues: marshall(attributeValues),
        FilterExpression: filterExpressions.length
            ? filterExpressions.join(' and ')
            : undefined,
        Limit: params.pagination.pageSize,
        ExclusiveStartKey: params.pagination.cursor
            ? marshall({ PK: `Folder#${params.pagination.cursor}` })
            : undefined,
        ScanIndexForward: params.sort.order === 'asc',
    };

    return pipe(
        new QueryCommand(query),
        sendReadCommand<IFolderRecord | IFileRecord>,
        TE.map((results) => {
            logger.debug(`Found contents: ${results.length}`);
            return results
                .map((r) => {
                    if (r.org !== params.orgId) return null;
                    if (r.entityType === 'File') return fromFileRecordToJson(r);
                    if (r.entityType === 'Folder')
                        return fromFolderRecordToJson(r);
                    return null;
                })
                .filter((a) => a !== null) as (IFile | IFolder)[];
        })
    );
}
