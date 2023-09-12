import { GetObjectCommand } from '@aws-sdk/client-s3';
import { logger, s3 } from '@common/utils';
import AdmZip from 'adm-zip';
import { S3Event } from 'aws-lambda';
import { Readable } from 'stream';
import { validate as isValidUUID } from 'uuid';
import { getJobId, getName, getOrgId, streamToBuffer } from '../lib';
import { Job } from '../lib/job';
import { processZip } from '../lib/processZip';

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

        const s3Key = `jobs/${orgId}/${jobId}/processing`;
        logger.debug('S3 key: ' + s3Key);

        let [folderId, folderName] = name.split('_');
        // If the folderId isn't ROOT or a folderId (i.e. it's just a file name, then we'll assume it's coming from ROOT).
        // When uploading the zip it'll send the folderId along with the file and create it with that Id so we know
        // what folder to unzip into.
        if (!folderName && folderId) {
            folderName = folderId;
        }

        if (folderId !== 'ROOT' && !isValidUUID(folderId)) {
            folderId = 'ROOT';
        }
        logger.debug('Folder ID', { folderId });

        await job.processing();

        // Get the zip file from S3
        logger.debug('Fetching file from s3');
        const s3Object = await s3.send(
            new GetObjectCommand({ Bucket: bucket, Key: key })
        );

        logger.debug('Converting file to buffer');
        const zipBuffer = await streamToBuffer(s3Object.Body as Readable);

        logger.debug('Reading zip file');
        const zip = new AdmZip(zipBuffer);

        await processZip(zip, folderId, s3Key, bucket, orgId);

        await job.success();
    } catch (error: any) {
        logger.error({ error, event, message: 'Error processing zip file' });
        await job.fail(error?.message ?? `Failed to process zip file.`);
        throw error;
    }
}
