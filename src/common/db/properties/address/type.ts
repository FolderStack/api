import { TableProperties } from "../../../types/TableProperties";

export interface ICreatePropertyAddress {
    streetNumber: string;
    streetName: string;
    city: string;
    stateOrProvince?: string;
    postalCode: string;
    country: string;
}

export interface IPropertyAddress extends TableProperties, ICreatePropertyAddress {
    PK: `PropertyAddress#${string}`;
    SK: `Property#${string}`;
    entityType: 'PropertyAddress';
}