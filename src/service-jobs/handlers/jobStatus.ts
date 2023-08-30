import { Ok, response } from "@common/responses";
import { APIGatewayProxyEventWithOrg, getPathParam, withErrorWrapper, withOrgWrapper } from "@common/utils";
import * as TE from 'fp-ts/TaskEither';
import { pipe } from "fp-ts/lib/function";
import { getJobStatus } from "../db/getJobStatus";

async function getJobStatusHandler(event: APIGatewayProxyEventWithOrg) {
    const jobId = getPathParam('jobId', event);
    const orgId = event.org.id;

    return pipe(
        getJobStatus(jobId, orgId),
        TE.map(res => {
            const allCompleted = res.every(branch => {
                return branch.status === 'FAILURE'
                    || branch.status === 'SUCCESS';
            });

            if (!allCompleted) return { complete: false };

            const errors = res.filter(branch => {
                return branch.status === 'FAILURE'
            }).map((branch: any) => ({
                branch: branch.branch,
                status: branch.status,
                message: branch.message
            }))

            return {
                complete: true,
                errors
            }
        }),
        response(Ok)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(getJobStatusHandler));