import { HttpNotFoundError } from '@common/errors';
import { getOrgByName } from './getOrgByName';

export async function getOrgByHostName(hostname: string) {
    try {
        const normalisedName = hostname.split('.')[0];
        const org = await getOrgByName(normalisedName);
        const allowedHost = org?.hostname ?? '';

        if (allowedHost.toLowerCase() === hostname.toLowerCase()) {
            return org;
        }

        return null;
    } catch (err) {
        throw new HttpNotFoundError();
    }
}
