import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambda, logger } from '@common/utils';

export async function createFolder(
    name: string,
    parent: string | null,
    orgId: string
) {
    logger.debug('createFolder request', {
        body: JSON.stringify({
            name,
            parent: parent ?? 'ROOT',
            orgId,
        }),
    });

    const result = await lambda.send(
        new InvokeCommand({
            FunctionName: `${process.env.SERVICE_NAME}-${process.env.STAGE}-createFolderInternal`,
            Payload: JSON.stringify({
                name,
                parent: parent ?? 'ROOT',
                orgId,
            }),
        })
    );

    const body = JSON.parse(
        JSON.parse(result.Payload?.transformToString() ?? '')?.body ?? ''
    );
    logger.debug('createFolder result:', {
        result: JSON.parse(result.Payload?.transformToString() ?? ''),
    });
    logger.debug('createFolder body:', { body });
    return body?.id ? String(body.id) : null;
}
