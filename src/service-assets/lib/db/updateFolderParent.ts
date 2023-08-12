import {
    TransactWriteCommand,
    TransactWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDb, sendBatchWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { fromJsonToFolderRecord } from '../fromFolderRecordToJson';
import { IFolder } from '../type';
import { UpdateTransactionItem } from './updateFolder';

function getParams(
    folderId: string,
    newParentId: string,
    oldParentId: string,
    folder: IFolder,
    org: string
) {
    const _folder = fromJsonToFolderRecord(folder);
    _folder.org = org;

    console.log(folder, _folder);

    return {
        TransactItems: [
            {
                Delete: {
                    TableName: config.tables.table, // or whatever your table's name is
                    Key: {
                        PK: `Folder#${folderId}`,
                        SK: `Parent#${oldParentId}`,
                    },
                },
            },
            {
                Delete: {
                    TableName: config.tables.table, // or whatever your table's name is
                    Key: {
                        PK: `Folder#${oldParentId}`,
                        SK: `Folder#${folderId}`,
                    },
                },
            },
            {
                Put: {
                    TableName: config.tables.table,
                    Item: {
                        ..._folder,
                        PK: `Folder#${newParentId}`,
                        SK: `Folder#${folderId}`,
                    },
                },
            },
            {
                Put: {
                    TableName: config.tables.table,
                    Item: {
                        PK: `Folder#${folderId}`,
                        SK: `Parent#${newParentId}`,
                        entityType: 'FolderParent',
                        org,
                    },
                },
            },
        ],
    };
}

export function updateFolderParent(
    folderId: string,
    newParentId: string,
    oldParentId: string,
    folder: IFolder,
    org: string,
    transact = true
) {
    const params = getParams(folderId, newParentId, oldParentId, folder, org);

    // then return a TaskEither that wraps the DynamoDB transactWrite call
    if (transact) {
        return TE.right(params.TransactItems as UpdateTransactionItem[]);
    } else {
        return sendBatchWriteCommand(params.TransactItems as any);
    }
}
export function updateFolderParentAsync(
    folderId: string,
    newParentId: string,
    oldParentId: string,
    folder: IFolder,
    org: string,
    transact: true
): ReturnType<typeof getParams>;
export function updateFolderParentAsync(
    folderId: string,
    newParentId: string,
    oldParentId: string,
    folder: IFolder,
    org: string,
    transact?: false
): Promise<TransactWriteCommandOutput>;
export function updateFolderParentAsync(
    folderId: string,
    newParentId: string,
    oldParentId: string,
    folder: IFolder,
    org: string,
    transact = true
) {
    if (newParentId === oldParentId) return [];

    const params = getParams(folderId, newParentId, oldParentId, folder, org);

    if (transact) return params;

    const transaction = new TransactWriteCommand(params);

    return dynamoDb.send(transaction as any);
}
