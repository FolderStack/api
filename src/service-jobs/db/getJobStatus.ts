import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb, sendReadCommand } from '@common/utils';
import { config } from '@config';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';

interface BaseJob {
    id: string;
    branch: string;
    orgId: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE'
}

interface JobWithError extends BaseJob {
    status: 'FAILURE';
    message: string;
}

type Job = BaseJob | JobWithError;

export function getJobStatus(
    jobId: string,
    orgId: string,
    branch?: undefined
): TE.TaskEither<Error, Job[]>;
export function getJobStatus(
    jobId: string,
    orgId: string,
    branch: string
): TE.TaskEither<Error, Job | null>;
export function getJobStatus(
    jobId: string,
    orgId: string,
    branch?: string
):
    | TE.TaskEither<Error, Job[]>
    | TE.TaskEither<Error, Job | null> {
    if (branch) {
        const command = new GetCommand({
            TableName: config.tables.table,
            Key: {
                PK: `Job#${jobId}`,
                SK: `Branch#${branch}`,
            },
        });

        return TE.tryCatch(
            async () => {
                const result = await dynamoDb.send(command);
                if (!result.Item) return null;

                const id = result.Item.PK.split('#')?.[1];
                const branch = result.Item.SK.split('#')?.[1];
                const orgId = result.Item.org;
                const status = result.Item.status;
                const message = result.Item.message;

                return { id, branch, orgId, status, message };
            },
            (err) => err as Error
        );
    } else {
        const command = new QueryCommand({
            TableName: config.tables.table,
            KeyConditionExpression: `PK = :PK`,
            FilterExpression: `entityType = :entityType AND org = :org`,
            ExpressionAttributeValues: marshall({
                ':PK': `Job#${jobId}`,
                ':entityType': 'Job',
                ':org': orgId,
            }),
        });

        return pipe(command, sendReadCommand, TE.map(res => {
            return res.map((item: any) => {
                const id = item.PK.split('#')?.[1];
                const branch = item.SK.split('#')?.[1];
                const orgId = item.org;
                const status = item.status;
                const message = item.message;

                return { id, branch, orgId, status, message };
            })
        }));
    }
}
