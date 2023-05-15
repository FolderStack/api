import { ClientBundleIOS } from '@common/types';
import axios from 'axios';
import { getAppleJWT } from '../utils';

export async function sendAttestationDataRequest(
    receipt: string,
    client: ClientBundleIOS
): Promise<unknown | null> {
    const privateKey = ''; // TODO: fetch private key
    const jwt = getAppleJWT(client.privateKeyId, client.teamId, privateKey);
    const url =
        'https://data-development.appattest.apple.com/v1/attestationData';

    const config = {
        headers: {
            Authorization: jwt,
            'Content-Type': 'application/octet-stream',
        },
    };

    try {
        const response = await axios.post(url, receipt, config);
        return response.data;
    } catch (error) {
        console.error('Error sending attestation data request:', error);
        return null;
    }
}
