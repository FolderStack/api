import { HttpBadRequestError } from '@common/errors';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';

function parseBody<T = any>(body: string | null): O.Option<T> {
    try {
        if (!body || typeof body !== 'string') {
            return O.none;
        }
        return O.some(JSON.parse(body));
    } catch {
        return O.none;
    }
}

export function getParsedBody<
    T extends APIGatewayProxyEvent,
    R = Record<string, unknown>
>(event: T): R | never {
    return pipe(
        event.body,
        parseBody,
        O.getOrElse(() => {
            throw new HttpBadRequestError();
        })
    );
}
