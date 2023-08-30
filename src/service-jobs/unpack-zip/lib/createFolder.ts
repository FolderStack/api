import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambda } from "@common/utils";

export async function createFolder(name: string, parent: string | null, orgId: string) {
    const result = await lambda.send(new InvokeCommand({
        FunctionName: `${process.env.SERVICE_NAME}-${process.env.STAGE}-createFolderInternal`,
        Payload: JSON.stringify({
            name,
            parent,
            orgId
        })
    }))
    return JSON.parse(result.Payload?.transformToString() ?? '')
}