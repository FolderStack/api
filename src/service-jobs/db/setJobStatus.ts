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

    if (job) {
        return updateStatus(jobId, orgId, status);
    } else {
        return createSubJob(jobId, orgId, status, data);
    }
}
