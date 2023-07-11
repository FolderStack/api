export const isLocal = process.env.ENV === 'local';

export const config = {
    queues: {},
    tables: {
        assetTable: process.env.ASSET_TABLE_NAME!,
        treeTable: process.env.TREE_TABLE_NAME!,
    },
    constants: {
        aws: {
            accessKeyId: process.env.ACCESS_KEY_ID!,
            secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
    },
    buckets: {
        assets: process.env.ASSET_BUCKET_NAME!,
    },
    auth0: {
        clientId: process.env.AUTH0_CLIENT_ID!,
        clientSecret: process.env.AUTH0_CLIENT_SECRET!,
        domain: process.env.AUTH0_DOMAIN!,
    },
    isLocal,
} as const;
