import { randomUUID } from "crypto";

export function createId<S extends string>(entityType: S): `${S}#${string}` {
    return `${entityType}#${randomUUID()}`
}