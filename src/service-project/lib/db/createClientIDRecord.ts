import { IClientCredentialsRecord } from "../type";

export function createClientIDRecord(
    version: string,
    clientId: string,
    clientSecret: string,
    clientType: 'cli' | 'app'
): IClientCredentialsRecord {
    return {
        PK: `Version#${version}`,
        SK: `ClientID#${clientId}`,
        entityType: 'ClientCredentials',
        clientSecret,
        clientType,
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null
    };
}