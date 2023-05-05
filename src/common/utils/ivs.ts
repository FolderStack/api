import { IvsClient } from '@aws-sdk/client-ivs';

export const ivs = new IvsClient({ region: process.env.REGION });