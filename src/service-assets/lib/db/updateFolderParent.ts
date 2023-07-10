import { sendBatchWriteCommand } from '@common/utils';
import { config } from '@config';
import { DynamoDB } from 'aws-sdk';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { IFolderRecord } from '../type';

export function updateFolderParent(
    folderId: string,
    newParentId: string,
    oldParentId: string,
    folder: IFolderRecord
): TE.TaskEither<Error, void> {
    const oldPK = `Folder#${oldParentId}`; // or however you determine the old parent ID
    const newPK = `Folder#${newParentId}`;
    const SK = `Folder#${folderId}`;

    const params: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
            {
                Delete: {
                    TableName: config.tables.assetTable, // or whatever your table's name is
                    Key: { PK: oldPK, SK },
                },
            },
            {
                Put: {
                    TableName: config.tables.assetTable,
                    Item: {
                        ...folder,
                        PK: newPK,
                        SK,
                    },
                },
            },
        ],
    };

    // then return a TaskEither that wraps the DynamoDB transactWrite call
    return pipe(params.TransactItems, sendBatchWriteCommand);
}
