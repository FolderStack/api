import { readFileSync } from 'fs';
import { resolve } from 'path';

export const getAttestCA = () => {
    if (process.env.NODE_ENV === 'test') {
        return readFileSync(resolve(__dirname, './AppleAttestCA.pem'));
    }
    return readFileSync(
        resolve(__dirname, '../lib/apple/assets/AppleAttestCA.pem')
    );
};

export const getAppleRootCA = () => {
    if (process.env.NODE_ENV === 'test') {
        return readFileSync(resolve(__dirname, './AppleRootCA-G3.pem'));
    }
    return readFileSync(
        resolve(__dirname, '../lib/apple/assets/AppleRootCA-G3.pem')
    );
};
