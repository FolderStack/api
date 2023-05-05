import axios from 'axios';
import { getAppleJWT } from '../utils';

export async function sendAttestationDataRequest(
    receipt: string
): Promise<unknown | null> {
    const jwt = getAppleJWT();
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
