import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sendReadCommand } from '@common/utils';
import { config } from '@config';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { IFile } from '../type';

export function getFilesByIdList(
    folderId: string,
    ids: string[],
    org: string
): TaskEither<Error, IFile[]> {
    const queryInput: QueryCommandInput = {
        TableName: config.tables.table,
        KeyConditionExpression: `PK = :folderId`,
        FilterExpression: `SK in (:fileIds) AND org = :org`,
        ExpressionAttributeValues: marshall({
            ':folderId': `Folder#${folderId}`,
            ':fileIds': ids.map((id) => `File#${id}`),
            ':org': org,
        }),
    };

    return pipe(new QueryCommand(queryInput), sendReadCommand<IFile>);
}
