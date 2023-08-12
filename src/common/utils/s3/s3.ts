import { S3Client } from '@aws-sdk/client-s3';

// const credentials = config.isLocal
//     ? {
//           accessKeyId: config.constants.aws.accessKeyId,
//           secretAccessKey: config.constants.aws.secretAccessKey,
//       }
//     : undefined;

export const s3 = new S3Client({
    region: process.env.REGION,
    // credentials,
});
