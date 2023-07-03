import * as O from 'fp-ts/Option';

export const parseBody = (body: string | null) => {
    try {
        return O.some(JSON.parse(body ?? ''));
    } catch {
        return O.none;
    }
};
