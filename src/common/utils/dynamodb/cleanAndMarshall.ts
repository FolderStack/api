import { marshall } from "@aws-sdk/util-dynamodb";

function clean(obj: any) {
    Object.keys(obj).forEach(key =>
      (obj[key] && typeof obj[key] === 'object') && clean(obj[key]) ||
      (obj[key] === undefined) && delete obj[key]
    );
    return obj;
}

export function cleanAndMarshall(item: any) {
    return marshall(clean(item));
}