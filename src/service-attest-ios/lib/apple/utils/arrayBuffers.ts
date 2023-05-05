export function arrayBufferEquals(a: ArrayBuffer, b: ArrayBuffer): boolean {
    if (a.byteLength !== b.byteLength) {
        return false;
    }

    const aView = new Uint8Array(a);
    const bView = new Uint8Array(b);

    for (let i = 0; i < a.byteLength; i++) {
        if (aView[i] !== bView[i]) {
            return false;
        }
    }

    return true;
}

export function toArrayBuffer(buffer: Buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}
