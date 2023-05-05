import { APIGatewayProxyEvent } from "aws-lambda";

export function expandFromEvent(event: APIGatewayProxyEvent, whitelist?: string[], prefix = '') {
    return (event?.queryStringParameters?.['expand'] ?? '')
        .split(',')
        .filter(e => (whitelist ?? []).includes(e))
        .map(w => prefix.length ? prefix.endsWith('.') ? prefix + w : prefix + '.' + w : w);
}