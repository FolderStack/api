import { parseAsn1Structure } from '../utils';
import { validateNonce } from './validateNonce';

// You should replace this with a real attestation object
const exampleAttestation =
    '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';

// Replace this with a real client data string
const exampleClientData = 'Q0hBTExFTkdFPz8/';

describe('validateNonce', () => {
    it('should return true for a valid nonce', () => {
        const request = parseAsn1Structure(exampleAttestation);
        const result = validateNonce(request, exampleClientData);
        expect(result).toBe(true);
    });

    it('should return false for an invalid nonce', () => {
        const invalidClientData = 'invalid_client_data';
        const request = parseAsn1Structure(exampleAttestation);
        const result = validateNonce(request, invalidClientData);
        expect(result).toBe(false);
    });
});