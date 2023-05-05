import { TableProperties, HasDates } from "../../../types";

export const UserTypes = ['Tenant', 'PropertyManager'] as const;
export type TUserType = typeof UserTypes[number];

export interface ICreateUser {
    name: string;
    
    email: string;
    emailVerified: boolean;
    
    phone: string;
    phoneVerified: boolean;

    dob: number;
    sex: string;
    
    type: TUserType;
}

export interface IUser extends TableProperties, HasDates, ICreateUser {
    PK: `User#${string}`;
    SK: `User#${string}`;
    entityType: 'User';
}