import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger, s3 } from '@common/utils';
import * as TE from 'fp-ts/TaskEither';

// Function to create presigned URLs
export function createPresignedPost(
    bucket: string,
    key: string,
    fileType?: string | null
): TE.TaskEither<Error, string> {
    return TE.tryCatch(
        async () => {
            const command = new PutObjectCommand({ Bucket: bucket, Key: key });
            if (fileType) {
                command.input.ContentType = fileType;
            }
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL will be valid for 1 hour
            return url;
        },
        (reason) => new Error(String(reason))
    );
}

// Function to create presigned URLs
export function createPresignedGet(
    bucket: string,
    key: string
): TE.TaskEither<Error, string> {
    return TE.tryCatch(
        async () => {
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL will be valid for 1 hour
            return url;
        },
        (reason) => new Error(String(reason))
    );
}

// Function to create presigned URLs
export async function createPresignedGetAsync(
    bucket: string,
    key: string
): Promise<string | null> {
    try {
        if (key[0] === '/') {
            key = key.substring(1);
        }
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL will be valid for 1 hour
        return url;
    } catch (err) {
        logger.debug('Error creating presigned get url', err);
        return null;
    }
}
