import { logger } from "@common/utils";

export function getOrgId(key: string) {
    logger.debug('Getting orgId from key: ' + key);
    const segments = key.split('/');
    if (segments.length < 4 || segments[0] !== "jobs") {
        logger.debug('Bad format');
        throw new Error(`Unexpected key format: ${key}`);
    }
    
    const orgId = segments[1];
    logger.debug(`Extracted Org ID: ${orgId}`);
    
    return orgId;
}