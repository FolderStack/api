import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { sendWriteCommand } from "@common/utils";
import { config } from "@config";
import * as TE from 'fp-ts/TaskEither';
import { pipe } from "fp-ts/lib/function";

export async function createSubJob(
    jobId: string,
    orgId: string,
    status: string,
    data: { branch: string } & Record<string, any>
) {
    const subJob = {
        ...data,
        orgId,
        status,
    };

    const createOne = new PutItemCommand({
        TableName: config.tables.table,
        Item: marshall({
            PK: `Job#${jobId}`,
            SK: `Branch#${data.branch}`,
            ...subJob
        })
    });
    
    return pipe(
        createOne,
        sendWriteCommand,
        TE.fold(
            (error) => () => Promise.reject(error),
            (a) => () => Promise.resolve(a)
        )
    )();
}