import { APIGatewayProxyEvent } from "aws-lambda";
import { HttpInternalServerError } from "../../errors";
import { pipe } from "fp-ts/function";
import * as E from 'fp-ts/Either'

export function validateSource(event: APIGatewayProxyEvent) {
    return pipe(
        E.tryCatch(
            () => {
                const appId = event.headers['x-app-id']
                const signature = event.headers['x-app-signature']

            },
            error => error instanceof Error ? error : new HttpInternalServerError()
        )
    )
}