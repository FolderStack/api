import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '@common/utils';
import * as TE from 'fp-ts/TaskEither';

// Function to create presigned URLs
export function createPresignedPost(
    bucket: string,
    key: string
): TE.TaskEither<Error, string> {
    return TE.tryCatch(
        async () => {
            const command = new PutObjectCommand({ Bucket: bucket, Key: key });
            const url = await getSignedUrl(s3, command, { expiresIn: 1800 }); // URL will be valid for 30 minutes
            return url;
        },
        (reason) => new Error(String(reason))
    );
}