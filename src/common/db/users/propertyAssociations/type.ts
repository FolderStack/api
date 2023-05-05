import { HasDates, TableProperties } from "../../../types";

export interface IStartUserPropertyAssociation {
    propertyId: `Property#${string}`
    contribution: number
    startDate: number
}

export interface IEndUserPropertyAssociation {
    endDate: number;
}

export interface IUserPropertyAssociation extends TableProperties , HasDates {
    PK: `User#${string}`;
    SK: `Property#${string}#${string}`;
    entityType: 'UserPropertyAssociation';

    propertyId: `Property#${string}`;
    contribution: number;
    startDate: number;
    endDate: number | null; // Null means the user is still associated with the property
}