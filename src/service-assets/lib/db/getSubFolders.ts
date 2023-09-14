import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb, sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFolderRecord } from '../type';

export function getSubFolders(parentId: string, orgId: string) {
    const queryParams: QueryCommandInput = {
        TableName: config.tables.table,
        KeyConditionExpression: `PK = :pk`,
        FilterExpression: `entityType = :entityType AND org = :org`,
        ExpressionAttributeValues: marshall({
            ':pk': `Folder#${parentId}`,
            ':entityType': 'Folder',
            ':org': orgId,
        }),
    };

    return pipe(
        new QueryCommand(queryParams),
        sendReadCommand<IFolderRecord>,
        TE.map((results) => {
            if (!results || !results.length) return [];
            return results
                .filter((a) => !!a)
                .map((r) => fromFolderRecordToJson(r));
        })
    );
}

export async function getSubFoldersAsync(parentId: string, orgId: string) {
    const queryParams: QueryCommandInput = {
        TableName: config.tables.table,
        KeyConditionExpression: `PK = :pk`,
        FilterExpression: `entityType = :entityType AND org = :org`,
        ExpressionAttributeValues: marshall({
            ':pk': `Folder#${parentId}`,
            ':entityType': 'Folder',
            // ':deletedAt': null,
            ':org': orgId,
        }),
    };

    const command = new QueryCommand(queryParams);
    const result = await dynamoDb.send(command);

    const data = result.Items?.map((item) => unmarshall(item));
    return (
        data?.filter((a) => !!a).map((r) => fromFolderRecordToJson(r as any)) ??
        []
    );
}
