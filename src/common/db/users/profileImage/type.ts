import { TableProperties } from "../../../types";

export interface ICreateUserProfileImage {
    s3Key: string;
}

export interface IUserProfileImage extends TableProperties, ICreateUserProfileImage {
    PK: `UserProfileImage#${string}`;
    SK: `User#${string}`;
    entityType: 'UserProfileImage';
}   