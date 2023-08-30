import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger, s3 } from "@common/utils";
import AdmZip from "adm-zip";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import { getJobId, getName, getOrgId, streamToBuffer, uploadToS3 } from "../lib";
import { createFolder } from "../lib/createFolder";
import { Job } from "../lib/job";

export async function handleZip(event: S3Event) {
    logger.debug('Entered handleZip', { event });
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

        logger.debug('Converting file to buffer');
        const zipBuffer = await streamToBuffer(s3Object.Body as Readable);

        logger.debug('Reading zip file')
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();

        const s3Key = `jobs/${orgId}/${jobId}/processing`
        logger.debug('S3 key: ' + s3Key);

        let [parent = null, folderName = null] = name.split('_');
        logger.debug('Parsed name', { parent, folderName });
        if (parent && !folderName) {
            folderName = parent;
            parent = null;
        }

        if (!folderName) {
            logger.debug("Couldn't get folder's name.")
            throw new Error("Couldn't get folder's name.")
        }

        logger.debug('Creating folder', { folderName, parent, orgId });
        const folderId = await createFolder(folderName, parent, orgId);

        await job.processing();
        for (const entry of zipEntries) {
            if (entry.isDirectory) {
                logger.debug('Entry is a directory...');

                // Process the directory (like zipping and uploading to S3 or other actions)
                const newZip = new AdmZip();

                logger.debug('Reading contents as text');
                const folderContents = zip.readAsText(entry.entryName); // Assuming text content

                logger.debug('Adding contents to new zip');
                newZip.addFile(entry.entryName, Buffer.from(folderContents));

                // The folderId will represent the parent ID of the folder created when this
                // zip is unpacked.
                const zipName = `${folderId}_${entry.name}.zip`;

                logger.debug('Sending zip to s3', { zipName })
                await uploadToS3(bucket, `${s3Key}/${zipName}`, newZip.toBuffer());
            } else if (entry.name.endsWith(".zip")) {
                logger.debug('Entry is already a zip...');
                // Upload the inner zip to S3 to trigger the same Lambda function again

                // The folderId will represent the parent ID of the folder created when this
                // zip is unpacked.
                const zipName = `${folderId}_${entry.name}`;

                logger.debug('Sending zip to s3', { zipName })
                await uploadToS3(bucket, `${s3Key}/${zipName}`, entry.getData());
            } else {
                logger.debug('Entry is a file...');

                // Upload the file to s3 as a file and process in the `createFileFromZipSource` lambda.
                const fileName = `${folderId}_${entry.name}`;

                logger.debug('Sending zip to s3', { fileName })
                await uploadToS3(bucket, `${s3Key}/_files/${fileName}`, entry.getData());
            }
        }
        await job.success();
    } catch (error: any) {
        logger.error({ error, event, message: "Error processing zip file" });
        await job.fail((error?.message ?? `Failed to process zip file.`))
        throw error;
    }
};