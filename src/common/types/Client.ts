import { HasDates } from "./HasDates";
import { TableProperties } from "./TableProperties";

export interface Client {
    PK: `Client#${string}`;
    SK: `Org#${string}`;
}

export interface ClientBundle extends HasDates, TableProperties {
    PK: `BundleID#${string}`;
    SK: `Client#${string}`;
    entityType: 'ClientBundle';
    os: 'ios' | 'android';
}

export interface ClientBundleIOS extends ClientBundle {
    bundleId: string;
    teamId: string;
    privateKeyId: string;
    os: 'ios';
}

export interface ClientBundleAndroid extends ClientBundle {
    os: 'android';
}