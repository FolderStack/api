import { TableProperties } from "../../../types/TableProperties";

export interface ICreatePropertyConfiguration {
    bedrooms: number;
    bathrooms: number;
    carports: number;
    [key: string]: string | number | boolean;
}

export interface IPropertyConfiguration extends TableProperties, ICreatePropertyConfiguration {
    PK: `PropertyConfiguration#${string}`;
    SK: `Property#${string}`;
    entityType: 'PropertyConfiguration';
}