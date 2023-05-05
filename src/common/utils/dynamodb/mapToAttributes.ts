import { marshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

type AttributeKey<T> = `:${Extract<T, string>}${number}`
type AttributeRecord<T, V = unknown> = Record<AttributeKey<T>, V>;
export function mapToAttributes<S extends string, T>(
    name: S,
    arr: AttributeRecord<S, T>[] | T[]
) {
    const attributes = {} as AttributeRecord<S, AttributeValue>;
    const keys: AttributeKey<S>[] = [];

    arr.forEach((item, idx) => {
        const key = `:${name}${idx}` as AttributeKey<S>;
        attributes[key] = marshall(item).value;
        keys.push(key);
    });

    return { attributes, keys };
}
