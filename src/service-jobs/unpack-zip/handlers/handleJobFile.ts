import { logger } from "@common/utils";
import { S3Event } from "aws-lambda";
import { handleUnzippedFile } from "./handleUnzippedFile";
import { handleZip } from "./handleZip";

export async function handler(event: S3Event) {
    logger.debug('Entered handleJobFile handler...')
    console.log(event)
    const key = event.Records[0].s3.object.key;

    logger.debug('Got key: ' + key);

    if (key.toLowerCase().endsWith('.zip')) {
        logger.debug('File is zip, going to unzip and recurse...')
        return handleZip(event);
    } else {
        logger.debug('File is not a zip, going to store it...')
        return handleUnzippedFile(event);
    }
}