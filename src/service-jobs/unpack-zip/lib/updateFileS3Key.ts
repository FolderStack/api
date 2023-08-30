import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambda, logger } from "@common/utils";

export async function updateFileS3Key(fileId: string, folderId: string, orgId: string, changes: any) {
    logger.debug('updateFileS3Key', {
        fileId,
        folderId,
        orgId,
        changes
    })

    const result = await lambda.send(new InvokeCommand({
        FunctionName: `${process.env.SERVICE_NAME}-${process.env.STAGE}-updateFileInternal`,
        Payload: JSON.stringify({
            fileId,
            folderId,
            orgId,

            ...changes
        })
    }))

    console.log('updateFileS3Key', { result });
}