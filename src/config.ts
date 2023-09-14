export const isLocal = process.env.ENV === 'local';

export const config = {
    queues: {
        zipQueue: process.env.ZIP_PROCESSOR_QUEUE,
    },
    tables: {
        table: process.env.TABLE_NAME!,
        config: process.env.CONFIG_TABLE_NAME!,
        caching: process.env.CACHE_TABLE_NAME!,
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
    dax: {
        endpoint: process.env.DAX_ENDPOINT,
    },
    isLocal,
} as const;
