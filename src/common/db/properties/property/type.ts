import { HasDates } from "../../../types";
import { TableProperties } from "../../../types/TableProperties";
import { ICreatePropertyAddress } from "../address";
import { ICreatePropertyConfiguration } from "../configuration";

export interface ICreateProperty {
    friendlyName?: string;
    address: ICreatePropertyAddress
    configuration: ICreatePropertyConfiguration
}

export interface IProperty extends TableProperties, HasDates {
    PK: `Property#${string}`;
    SK: `Property#${string}`;
    entityType: 'Property';

    friendlyName: string | null;

    // Reference to a PropertyAddress item
    addressId: string;

    // Reference to a PropertyConfiguration item
    configId: string;

    // Reference to a list of Media items
    mediaIds: string[]
}