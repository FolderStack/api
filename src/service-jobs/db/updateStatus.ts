import {
    UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sendWriteCommand } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';

export async function updateStatus(jobId: string, status: string, branch: string, data: Record<string, any>) {
    const updateExpressions = [];
    const attributeNames: Record<string, unknown> = {};
    const attributeValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries({
        ...data,
        status,
        branch
    })) {
        updateExpressions.push(`#${key} = :${key}`);
        attributeNames[`#${key}`] = key;
        attributeValues[`:${key}`] = value;
    }

    const updateCommand = new UpdateItemCommand({
        TableName: config.tables.table,
        Key: marshall({
            PK: `Job#${jobId}`,
            SK: `Branch#${branch}`,
        }),
        UpdateExpression: 'SET ' + updateExpressions.join(', '),
        ExpressionAttributeNames: attributeNames as any,
        ExpressionAttributeValues: marshall(attributeValues),
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