import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { logger, sqs } from '@common/utils';
import { config } from '@config';
import { S3Event } from 'aws-lambda';

export async function handler(event: S3Event) {
    logger.debug('enqueueZipProcessing', { event });
    const key = event.Records[0].s3.object.key;

    const cmd = new SendMessageCommand({
        QueueUrl: config.queues.zipQueue,
        MessageBody: JSON.stringify({
            key,
            bucket: config.buckets.assets,
        }),
    });

    logger.debug('Sending message to queue', { cmd });

    await sqs.send(cmd);
}
