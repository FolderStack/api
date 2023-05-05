export function normaliseDate(unix: number) {
    const date = new Date(unix);
    return date.toISOString().substring(0, 10);
}
