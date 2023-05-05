import { ICreateUser, IUser } from "../user/type";
import { createId } from "../../createId";

export function createUser(user: ICreateUser): IUser {
    const id = createId('User')
    return {
        PK: id,
        SK: id,
        entityType: 'User',
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
        ...user
    }
}