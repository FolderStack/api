import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@common/utils";

export async function uploadToS3(bucket: string, key: string, buffer: Buffer): Promise<void> {
    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer
    }));
}
