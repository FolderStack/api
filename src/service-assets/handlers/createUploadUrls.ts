import { Ok, response } from '@common/responses';
import {
    APIGatewayProxyEventWithOrg,
    createPresignedPost,
    getParsedBody,
    validate,
    withErrorWrapper,
    withOrgWrapper,
} from '@common/utils';
import { config } from '@config';
import { randomUUID } from 'crypto';
import { array } from 'fp-ts';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import mime from 'mime';
import { object, string } from 'zod';

async function createUploadUrlHandler(event: APIGatewayProxyEventWithOrg) {
    const { fileNames } = validate(
        getParsedBody(event),
        object({
            fileNames: string().array(),
        })
    );

    const createSignedUrls = pipe(
        fileNames.map(String),
        array.map((fileName) => {
            const id = randomUUID();
            const name = fileName.replace(/[^a-zA-Z0-9.]/gi, '_');
            const key = `uploads/${event.org.id}/${id}/${name}`;
            const fileType = (mime as any).getType(name);

            return pipe(
                createPresignedPost(config.buckets.assets, key, fileType),
                TE.map((url) => [fileName, url])
            );
        }),
        TE.sequenceArray,
        TE.map(Object.fromEntries)
    );

    return pipe(createSignedUrls, response(Ok))();
}

export const handler = withErrorWrapper(withOrgWrapper(createUploadUrlHandler));
