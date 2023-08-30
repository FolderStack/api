import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambda, logger } from "@common/utils";

export async function createFile(
    name: string,
    fileSize: number,
    fileType: string,
    s3Key: string,
    folderId: string,
    orgId: string
) {
    const result = await lambda.send(new InvokeCommand({
        FunctionName: `${process.env.SERVICE_NAME}-${process.env.STAGE}-createFileInternal`,
        Payload: JSON.stringify({
            name,
            fileSize,
            fileType,
            file: s3Key,
            folderId,
            orgId
        })
    }))
    const body = JSON.parse(JSON.parse(result.Payload?.transformToString() ?? '')?.body ?? '');
    logger.debug('createFile result:', { result: JSON.parse(result.Payload?.transformToString() ?? '') });
    logger.debug('createFile body:', { body })
    return body?.id ? String(body.id) : null;
}