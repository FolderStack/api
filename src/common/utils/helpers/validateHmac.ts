import { APIGatewayProxyEvent } from "aws-lambda";
import { createHmac } from "crypto";

export function validateHmac(event: APIGatewayProxyEvent, validateAttestation = false) {
    const signature = event.headers['x-signature'] ?? ''
    const platform = event.headers['x-platform'] ?? ''
    const client = event.headers['x-client-id'] ?? ''
    const accessToken = event.headers['authorization'] ?? ''
    
    const version = '' // await getVersionFromClientId(client)
    const attestation = event.headers['x-attestation'] ?? ''

    const body = event.body ?? ''
    const url = event.path ?? ''
    const method = event.httpMethod ?? ''

    if (!(signature && platform && client && version && accessToken && url && method)) {
        return false
    }  

    let platformPart = platform
    if (validateAttestation) {
        if (!attestation) return false
        platformPart += attestation
    }

    const constructSignature = Buffer.from(
        method + url + platformPart + client + version + accessToken + body
    ).toString('base64')
    const secretKey = '' // get this somehow..

    const hmac = createHmac('SHA256', secretKey)
    hmac.write(constructSignature)
    const output = hmac.digest('base64')

    if (output !== signature) return false
    return true
}