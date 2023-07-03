import { HttpBadRequestError } from '@common/errors';
import { Ok, response } from '@common/responses';
import { getOrgId, parseBody } from '@common/utils';
import { config } from '@config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { array } from 'fp-ts';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { createPresignedPost } from '../lib/createPresignedUrl';

export async function handler(event: APIGatewayProxyEvent) {
    const orgId = getOrgId(event);

    const parsedBody = pipe(
        event.body,
        parseBody as any,
        O.getOrElse(() => {
            throw new HttpBadRequestError();
        })
    );

    const { fileNames } = parsedBody as any;
    if (!Array.isArray(fileNames)) {
        return new HttpBadRequestError().toResponse();
    }

    const keys = fileNames.map(String);
    const bucket = config.buckets.assets;

    const createSignedUrls = pipe(
        keys,
        array.map((fileName) => {
            const id = randomUUID();
            const key = `uploads/${orgId}/${id}/${fileName}`;
            return pipe(
                createPresignedPost(bucket, key),
                TE.map((url) => [fileName, url] as const)
            );
        }),
        TE.sequenceArray,
        TE.map(Object.fromEntries)
    );

    return pipe(createSignedUrls, response(Ok))();
}
