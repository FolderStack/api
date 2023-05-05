import * as E from 'fp-ts/Either'

export function parseJson<R>(json?: string | null): E.Either<Error, R> {
    return E.tryCatch(
        () => JSON.parse(json ?? '{}') as R,
        error => error instanceof Error ? error : new Error('Failed to parse')
    )
}