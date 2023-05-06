import { HasDates, TableProperties } from "../../common/types";

export interface IClientCredentialsRecord extends TableProperties, HasDates {
    PK: `Version#${string}`,
    SK: `ClientID#${string}`,
    entityType: 'ClientCredentials',
    clientSecret: string;
    clientType: string;
}

export interface IClientCredentials extends HasDates {
    clientId: string;
    clientSecret: string;
    clientType: string;
}