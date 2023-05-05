export const isLocal = process.env.ENV === 'local';

export const config = {
    queues: {},
    tables: {
        integrityTable: `integrity-${process.env.ENV}`,
    },
    constants: {},
} as const;
