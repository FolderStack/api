import * as Crypto from 'crypto'

export function secureHash(input: string) {
    const hash = Crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}