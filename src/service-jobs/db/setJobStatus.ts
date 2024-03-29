import { DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { createSubJob } from './createSubJob';
import { getJobStatus } from './getJobStatus';
import { updateStatus } from './updateStatus';

export async function setJobStatus(
    jobId: string,
    orgId: string,
    status: string,
    data: { branch: string } & Record<string, string | number>
) {
    const job = await pipe(
        getJobStatus(jobId, orgId, data.branch),
        TE.fold(
            (err) => () => Promise.reject(err),
            (res) => () => Promise.resolve(res)
        )
    )();

    if (status === 'SUCCESS' && job) {
        await dynamoDb.send(new DeleteItemCommand({
            TableName: config.tables.table,
            Key: marshall({
                PK: `Job#${jobId}`,
                SK: `Branch#${data.branch}`
            })
        }))
        return;
    }

    if (job) {
        return updateStatus(jobId, status, data.branch, data);
    } else {
        return createSubJob(jobId, orgId, status, data);
    }
}
