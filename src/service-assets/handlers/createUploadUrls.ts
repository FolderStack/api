import { HttpBadRequestError } from '@common/errors';
import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    parseBody,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { config } from '@config';
import { randomUUID } from 'crypto';
import { array } from 'fp-ts';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import mime from 'mime';
import { createPresignedPost } from '../lib/createPresignedUrl';

async function createUploadUrlHandler(event: APIGatewayProxyEventWithOrg) {
    const parsedBody = pipe(
        event.body,
        parseBody as any,
        O.getOrElse(() => {
            throw new HttpBadRequestError();
        })
    );

    const { fileNames } = parsedBody as any;
    if (!Array.isArray(fileNames)) {
        throw new HttpBadRequestError();
    }

    const keys = fileNames.map(String);
    const bucket = config.buckets.assets;

    const createSignedUrls = pipe(
        keys,
        array.map((fileName) => {
            const id = randomUUID();
            const name = fileName.replace(/[^a-zA-Z0-9.]/gi, '_');
            const key = `uploads/${event.org.id}/${id}/${name}`;
            const fileType = mime.getType(name);

            return pipe(
                createPresignedPost(bucket, key, fileType),
                TE.map((url) => [fileName, url] as const)
            );
        }),
        TE.sequenceArray,
        TE.map(Object.fromEntries)
    );

    return pipe(createSignedUrls, response(Ok))();
}

export const handler = withErrorWrapper(withOrgWrapper(createUploadUrlHandler));
