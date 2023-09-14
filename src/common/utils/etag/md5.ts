import { createHash } from 'crypto';

export function md5(input: string) {
    return createHash('md5').update(input).digest('hex');
}
