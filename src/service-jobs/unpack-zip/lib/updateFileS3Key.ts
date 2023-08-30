import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambda } from "@common/utils";

export async function updateFileS3Key(fileId: string, folderId: string, orgId: string, s3Key: string) {
    await lambda.send(new InvokeCommand({
        FunctionName: `${process.env.SERVICE_NAME}-${process.env.STAGE}-updateFileInternal`,
        Payload: JSON.stringify({
            fileId,
            folderId,
            orgId,

            file: s3Key
        })
    }))
}