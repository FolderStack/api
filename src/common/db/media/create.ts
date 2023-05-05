import { createId } from "../createId";
import { normaliseDate } from "../normaliseDate";
import { ICreateMedia, IMedia } from "./type";

export function createMedia(
    propertyId: `Property#${string}`,
    createdBy: `User#${string}`,
    media: ICreateMedia
): IMedia {
    const id = createId('Media')
    const date = normaliseDate(Date.now())

    return {
        PK: id,
        SK: `${propertyId}#${date}`,
        entityType: 'Media',
        createdBy,
        createdAt: Date.now(),
        updatedAt: null,
        deletedAt: null,
        ...media,
    }
}