import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger, s3 } from "@common/utils";
import { S3Event } from "aws-lambda";
import mime from 'mime';
import { createFile, getJobId, getName, getOrgId } from "../lib";
import { Job } from "../lib/job";
import { updateFileS3Key } from "../lib/updateFileS3Key";

export async function handleUnzippedFile(event: S3Event) {
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    const orgId = getOrgId(key);
    const jobId = getJobId(key);
    const name = getName(key);

    const job = new Job(jobId, orgId);

    try {
        job.setBranch(key);
        await job.pending();

        // Get the zip file from S3
        logger.debug('Fetching file from s3');
        const s3Object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

        let [parent = null, fileName = null] = name.split('_');
        logger.debug('Parsed name', { parent, fileName });
        if (parent && !fileName) {
            fileName = parent;
            parent = null;
        }

        if (!fileName) {
            logger.debug("Couldn't get file's name.")
            throw new Error("Couldn't get file's name.")
        }

        if (!parent) {
            logger.debug("Couldn't get file's containing folder.")
            throw new Error("Couldn't get file's containing folder.")
        }

        const fileSize = event.Records[0].s3.object.size;
        let fileType = s3Object.ContentType

        logger.debug('Got file size: ' + fileSize);

        if (!fileType) {
            fileType = mime.lookup(fileName);
            if (!fileType) {
                logger.debug('Failed to get file type');
                throw new Error("Couldn't recognise file's type.")
            }
        }
        logger.debug('Got file type: ' + fileType);

        logger.debug('Creating file', {
            fileName, fileSize, fileType, parent, orgId
        })
        const fileId = await createFile(fileName, fileSize, fileType, '', parent, orgId);

        // Construct the new destination key for the file
        const liveDestKey = `uploads/${orgId}/${fileId}/${fileName}`;
        const processedDestKey = `jobs/${orgId}/${jobId}/processed/_files/${fileId}_${fileName}`;

        logger.debug('Constructed destination keys', {
            liveDestKey,
            processedDestKey
        })

        logger.debug('Sendig copy commands & updating s3 key');
        await Promise.allSettled([
            // Use S3's copy command to copy the file to live assets.
            s3.send(new CopyObjectCommand({
                Bucket: bucket,
                CopySource: encodeURIComponent(`${bucket}/${key}`),
                Key: liveDestKey
            })),

            // copy the file to the processed area for eventual deletion.
            s3.send(new CopyObjectCommand({
                Bucket: bucket,
                CopySource: encodeURIComponent(`${bucket}/${key}`),
                Key: processedDestKey
            })),

            // Update the file's S3 Key as we left it empty above.
            updateFileS3Key(fileId, parent, orgId, liveDestKey)
        ])

        // Delete the original
        logger.debug('Deleting old object');
        await s3.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: processedDestKey
        }));
    } catch (error: any) {
        logger.error({ error, event, message: "Error processing file" });
        await job.fail((error?.message ?? `Failed to process file.`))
        throw error;
    }
}