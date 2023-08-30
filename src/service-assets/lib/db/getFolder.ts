import {
    GetItemCommand,
    GetItemCommandInput,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpForbiddenError, HttpNotFoundError } from '@common/errors';
import { dynamoDb, logger, sendReadCommand } from '@common/utils';
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
        TableName: config.tables.table,
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
            logger.debug('getFolder', { res, findParentParams });
            if (!res) {
                return TE.left(new HttpNotFoundError());
            }

            const getParams: GetItemCommandInput = {
                TableName: config.tables.table,
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

export async function getFolderAsync(folderId: string, org: string) {
    // if (folderId.toLowerCase() === 'root') {
    //     const command = new QueryCommand({
    //         TableName: config.tables.table,
    //         KeyConditionExpression: `PK = :folderId`,
    //         FilterExpression: `entityType = :entityType AND org = :orgId`,
    //         ExpressionAttributeValues: marshall({
    //             ':folderId': `Folder#${folderId}`,
    //             ':orgId': org,
    //             ':entityType': 'Folder',
    //         }),
    //     });
    //     const result = await dynamoDb.send(command);
    //     return result.Items?.map((record) =>
    //         fromFolderRecordToJson(unmarshall(record) as any)
    //     );
    // }

    const findParentParams: QueryCommandInput = {
        TableName: config.tables.table,
        KeyConditionExpression: `PK = :folderId`,
        FilterExpression: `entityType = :entityType AND org = :orgId`,
        ExpressionAttributeValues: marshall({
            ':folderId': `Folder#${folderId}`,
            ':orgId': org,
            ':entityType': 'FolderParent',
        }),
    };

    const findParentCommand = new QueryCommand(findParentParams);
    const parentRaw = await dynamoDb.send(findParentCommand);

    const parent = parentRaw.Items?.map((item) => unmarshall(item))[0];

    if (!parent) {
        throw new HttpNotFoundError();
    }

    const getParams: GetItemCommandInput = {
        TableName: config.tables.table,
        Key: marshall({
            PK: parent.SK.replace('Parent', 'Folder'),
            SK: parent.PK,
        }),
    };

    const command = new GetItemCommand(getParams);
    const result = await dynamoDb.send(command);

    const item = unmarshall(result.Item ?? {});

    if (!item || Object.keys(item ?? {}).length === 0) {
        throw new HttpNotFoundError();
    }

    if (item.org !== org) {
        throw new HttpForbiddenError();
    }

    return fromFolderRecordToJson(item as any);
}
