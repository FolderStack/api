import { reduce } from 'fp-ts/lib/Array';

type IncomingObject<S extends string> = { [k in S]: string; } & Record<string, unknown>;

export function groupObjectsByKey<S extends string, T extends IncomingObject<S>>(
    key: S,
    objs: T[]
) {
    return reduce({} as Record<string, T[]>, (acc, obj: T) => {
        acc[obj[key]] = acc[obj[key]]
            ? [...acc[obj[key]], obj]
            : [obj];
        return acc
    })(objs);
};

export function groupObjectsByKeyMap<S extends string, T extends IncomingObject<S>>(key: S) {
    return function(objs: T[]) {
        return groupObjectsByKey(key, objs)
    }
}