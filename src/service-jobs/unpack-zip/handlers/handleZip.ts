import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger, s3 } from "@common/utils";
import AdmZip from "adm-zip";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import { getJobId, getName, getOrgId, streamToBuffer } from "../lib";
import { createFolder } from "../lib/createFolder";
import { Job } from "../lib/job";
import { processZip } from "../lib/processZip";

export async function handleZip(event: S3Event) {
    logger.debug('Entered handleZip', { event });
    const bucket = event.Records[0].s3.bucket.name;
    let key = event.Records[0].s3.object.key;

    if (key.includes('+')) {
        key = key.replace(/\+/g, ' ');
    }

    const orgId = getOrgId(key);
    const jobId = getJobId(key);
    const name = getName(key);

    if (key.includes('/processed/')) {
        logger.debug('Skipping file, in processed folder...');
        return;
    }

    const job = new Job(jobId, orgId);

    try {
        job.setBranch(key);
        await job.pending();

        const s3Key = `jobs/${orgId}/${jobId}/processing`
        logger.debug('S3 key: ' + s3Key);

        let [parent = null, folderName = null] = name.split(/_(.*)/s);
        if (parent && !folderName) {
            folderName = parent;
            parent = 'ROOT';
        }
        logger.debug('Parsed name', { parent, folderName });

        if (!folderName) {
            logger.debug("Couldn't get folder's name.")
            throw new Error("Couldn't get folder's name.")
        }

        folderName = folderName.replace('.zip', '');
        logger.debug('Creating folder', { folderName, parent, orgId });
        const folderId = await createFolder(folderName, parent, orgId);

        if (!folderId) {
            logger.debug('Failed to get folderId from creating folder');
            throw new Error('Failed to get folderId from creating folder');
        }
        logger.debug('FolderID result', { folderId });

        await job.processing();
        
        // Get the zip file from S3
        logger.debug('Fetching file from s3');
        const s3Object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

        logger.debug('Converting file to buffer');
        const zipBuffer = await streamToBuffer(s3Object.Body as Readable);

        logger.debug('Reading zip file')
        const zip = new AdmZip(zipBuffer);
    
        await processZip(zip, folderId, key, bucket);

        await job.success();
    } catch (error: any) {
        logger.error({ error, event, message: "Error processing zip file" });
        await job.fail((error?.message ?? `Failed to process zip file.`))
        throw error;
    }
};