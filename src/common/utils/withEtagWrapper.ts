import { APIGatewayProxyResult, Callback, Context } from 'aws-lambda';
import * as Crypto from 'crypto';
import { APIGatewayProxyEventWithOrg } from '..';

const headersToUse = ['Accept', 'Accept-Language', 'Accept-Encoding'];

export function withEtagWrapper(
    fn: (
        event: APIGatewayProxyEventWithOrg,
        context: Context,
        callback: Callback
    ) => Promise<APIGatewayProxyResult>,
    cacheTime = 300
) {
    return async function handler(
        event: APIGatewayProxyEventWithOrg,
        context: Context,
        callback: Callback
    ): Promise<APIGatewayProxyResult> {
        const org = event.org.id;
        const path = event.path;
        const qs = Object.entries(event.queryStringParameters ?? {})
            .map(
                ([key, val]) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        JSON.stringify(val)
                    )}`
            )
            .join('&');

        let etagKey = `path:${path};qs:${qs};org:${org}`;

        for (const header of headersToUse) {
            etagKey += event.headers[header] ?? '';
        }

        const response = await fn(event, context, callback);

        const responseStr = JSON.stringify(response);
        const etag = Crypto.createHash('md5')
            .update(`${etagKey}=${responseStr}`)
            .digest('hex');

        response.headers = {
            ...(response.headers ?? {}),
            ETag: etag,
            'Cache-Control': `max-age=${cacheTime}`,
        };

        return response;
    };
}
