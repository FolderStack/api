import { logger } from "@common/utils";

export function getName(key: string) {
    logger.debug('Getting name from key: ' + key);
    const segments = key.split('/');
    
    const name = segments[segments.length - 1];
    
    logger.debug(`Extracted Name: ${name}`);
    return name;
}