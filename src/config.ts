export const isLocal = process.env.ENV === 'local';

export const config = {
    queues: {},
    tables: {
        table: process.env.TABLE_NAME!,
    },
    constants: {},
    buckets: {
        assets: process.env.BUCKET_NAME!,
    },
    auth0: {
        clientId: process.env.AUTH0_CLIENT_ID!,
        clientSecret: process.env.AUTH0_CLIENT_SECRET!,
        domain: process.env.AUTH0_DOMAIN!,
    },
    isLocal,
} as const;
