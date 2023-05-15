import * as forge from 'node-forge';

export function getOctetStringValue(
    asn1Object: string | forge.asn1.Asn1 | forge.asn1.Asn1[]
): Buffer | null {
    if (typeof asn1Object == 'object') {
        if (asn1Object instanceof Array) {
            for (const subAsn1Object of asn1Object) {
                const result = getOctetStringValue(subAsn1Object);
                if (result) {
                    return Buffer.from(result);
                }
            }
        } else if (asn1Object.type === forge.asn1.Type.OCTETSTRING) {
            if (typeof asn1Object.value !== 'string') {
                return getOctetStringValue(asn1Object.value);
            }
            return Buffer.from(asn1Object.value);
        } else if (Array.isArray(asn1Object.value)) {
            for (const subAsn1Object of asn1Object.value) {
                const result = getOctetStringValue(subAsn1Object);
                if (result) {
                    return Buffer.from(result);
                }
            }
        }
        return null;
    }
    return Buffer.from(asn1Object);
}
