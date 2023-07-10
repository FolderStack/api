import { config } from '@config';
import { AuthenticationClient, ManagementClient } from 'auth0';

const auth = new AuthenticationClient({
    clientId: config.auth0.clientId,
    clientSecret: config.auth0.clientSecret,
    domain: config.auth0.domain,
});

export async function getAuth0() {
    const token = await auth.clientCredentialsGrant({
        audience: `${config.auth0.domain}/api/v2/`,
    });

    return new ManagementClient({
        token: token.access_token,
        domain: config.auth0.domain,
    });
}
