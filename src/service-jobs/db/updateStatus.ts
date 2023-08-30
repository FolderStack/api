import {
    UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';

export async function updateStatus(jobId: string, status: string, branch: string) {
    const updateCommand = new UpdateItemCommand({
        TableName: config.tables.table,
        Key: marshall({
            PK: `Job#${jobId}`,
            SK: `Branch#${branch}`,
        }),
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
            ':status': status,
        }),
    });

    pipe(
        updateCommand,
        sendWriteCommand,
        TE.fold(
            (error) => () => Promise.reject(error),
            (a) => () => Promise.resolve(a)
        )
    )();
}