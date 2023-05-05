import { createId } from "../../createId";
import { ICreateUserProfileImage, IUserProfileImage } from "./type";

export function createUserProfileImage(
    userId: `User#${string}`,
    image: ICreateUserProfileImage
): IUserProfileImage {
    const id = createId('UserProfileImage')
    return {
        PK: id,
        SK: userId,
        entityType: 'UserProfileImage',
        ...image
    }
}