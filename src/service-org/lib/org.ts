import { getAuth0 } from '@common/auth0';
import { HttpNotFoundError } from '@common/errors';

export async function getOrgByName(name: string) {
    try {
        const auth0 = await getAuth0();
        const org = await auth0.organizations.getByName({ name });
        return org;
    } catch (err) {
        throw new HttpNotFoundError();
    }
}
