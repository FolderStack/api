import { GetObjectCommand } from '@aws-sdk/client-s3';
import { logger, s3 } from '@common/utils';
import { config } from '@config';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';

export function getReadableStreamFromS3(s3Key: string) {
    const command = new GetObjectCommand({
        Bucket: config.buckets.assets,
        Key: s3Key,
    });

    return pipe(
        TE.tryCatch(
            () => s3.send(command),
            (err: any) => Error(String(err?.message))
        ),
        TE.map((output) => output.Body)
    );
}

export async function getReadableStreamFromS3Async(s3Key: string) {
    const command = new GetObjectCommand({
        Bucket: config.buckets.assets,
        Key: s3Key,
    });
    logger.debug('getReadableStreamFromS3Async', { command });
    const response = await s3.send(command);

    logger.debug('getReadableStreamFromS3Async has body?', {
        size: response.ContentLength,
    });

    return response.Body;
}
