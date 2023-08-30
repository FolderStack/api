import { logger } from "@common/utils";

export function getJobId(key: string) {
    logger.debug('Getting jobId from key: ' + key);
    const segments = key.split('/');
    if (segments.length < 4 || segments[0] !== "jobs") {
        logger.debug('Bad format');
        throw new Error(`Unexpected key format: ${key}`);
    }
    
    const jobId = segments[2];
    
    logger.debug(`Extracted Job Id: ${jobId}`);
    return jobId;
}