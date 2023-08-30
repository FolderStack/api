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
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { object, string } from 'zod';
import { createSubJob } from '../db/createSubJob';

async function createZipUploadUrlHandler(event: APIGatewayProxyEventWithOrg) {
    const { fileName } = validate(
        getParsedBody(event),
        object({
            fileName: string(),
        })
    );

    const id = randomUUID();
    const name = fileName.replace(/[^a-zA-Z0-9.]/gi, '_');

    const jobId = randomUUID();
    await createSubJob(jobId, event.org.id, 'PENDING', { branch: 'ROOT' });
    
    const key = `jobs/${event.org.id}/${jobId}/${id}/${name}`;

    return pipe(
        createPresignedPost(config.buckets.assets, key, 'application/zip'),
        TE.map(res => {
            return {
                url: res,
                jobId
            }
        }),
        response(Ok)
    )();
}

export const handler = withErrorWrapper(withOrgWrapper(createZipUploadUrlHandler));
