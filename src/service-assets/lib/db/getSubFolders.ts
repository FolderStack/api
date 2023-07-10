import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sendReadCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { fromFolderRecordToJson } from '../fromFolderRecordToJson';
import { IFolderRecord } from '../type';

export function getSubFolders(parentId: string, orgId: string) {
    const queryParams: QueryCommandInput = {
        TableName: config.tables.assetTable,
        KeyConditionExpression: `PK = :pk`,
        FilterExpression: `entityType = :entityType AND deletedAt = :deletedAt AND org = :org`,
        ExpressionAttributeValues: marshall({
            ':pk': `Folder#${parentId}`,
            ':entityType': 'Folder',
            ':deletedAt': null,
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
