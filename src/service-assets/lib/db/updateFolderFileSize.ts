import {
    QueryCommand,
    UpdateItemCommand,
    UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sendReadCommand, sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { IFolderRecord } from '../type';

export function updateFolderFileSize(
    folderId: string,
    delta: number,
    orgId: string
): TE.TaskEither<Error, void> {
    const getParams: QueryCommandInput = {
        TableName: config.tables.assetTable,
        KeyConditionExpression: `PK = :folderId`,
        FilterExpression: `entityType = :entityType AND org = :orgId`,
        ExpressionAttributeValues: marshall({
            ':folderId': `Folder#${folderId}`,
            ':orgId': orgId,
            ':entityType': 'Folder',
        }),
    };

    return pipe(
        new QueryCommand(getParams),
        sendReadCommand<IFolderRecord>,
        TE.chain((results) => {
            const result = results?.[0];
            if (result) {
                const fileSize = result.fileSize + delta;
                const updateParams: UpdateItemCommandInput = {
                    TableName: config.tables.assetTable,
                    Key: marshall({
                        PK: result.PK,
                        SK: result.SK,
                    }),
                    UpdateExpression: 'SET fileSize = :fileSize',
                    ExpressionAttributeValues: marshall({
                        ':fileSize': Math.max(0, fileSize),
                    }),
                };

                console.log({ updateParams });

                const command = new UpdateItemCommand(updateParams);
                return sendWriteCommand(command);
            } else {
                return TE.right(void 0);
            }
        })
    );
}
