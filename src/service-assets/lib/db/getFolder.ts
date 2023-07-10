import {
    GetItemCommand,
    GetItemCommandInput,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpForbiddenError, HttpNotFoundError } from '@common/errors';
import { dynamoDb, sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFolder, IFolderParentRecord, IFolderRecord } from '../type';

export function getFolder(
    folderId: string,
    org: string
): TE.TaskEither<Error, IFolder> {
    const findParentParams: QueryCommandInput = {
        TableName: config.tables.assetTable,
        KeyConditionExpression: `PK = :folderId`,
        FilterExpression: `entityType = :entityType AND org = :orgId`,
        ExpressionAttributeValues: marshall({
            ':folderId': `Folder#${folderId}`,
            ':orgId': org,
            ':entityType': 'FolderParent',
        }),
    };

    return pipe(
        new QueryCommand(findParentParams),
        sendReadCommand<IFolderParentRecord>,
        TE.chain(([res]) => {
            console.log({ res }, findParentParams);
            if (!res) {
                return TE.left(new HttpNotFoundError());
            }

            const getParams: GetItemCommandInput = {
                TableName: config.tables.assetTable,
                Key: marshall({
                    PK: res.SK.replace('Parent', 'Folder'),
                    SK: res.PK,
                }),
            };

            return TE.fromTask(async () => {
                const command = new GetItemCommand(getParams);
                const result = await dynamoDb.send(command);
                return result;
            });
        }),
        TE.chain((result) => {
            const item = unmarshall(result.Item ?? {});

            if (!item || Object.keys(item ?? {}).length === 0) {
                return TE.left(new HttpNotFoundError());
            }

            if (item.org !== org) {
                return TE.left(new HttpForbiddenError());
            }

            return TE.right(item as IFolderRecord);
        }),
        TE.map((result) => {
            return fromFolderRecordToJson(result);
        })
    );
}
