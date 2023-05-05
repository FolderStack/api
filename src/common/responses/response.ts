import { APIGatewayProxyResult } from "aws-lambda";
import { HttpError, HttpInternalServerError } from "../errors";
import { logger } from "../utils";
import * as TE from 'fp-ts/TaskEither'
import { pipe } from "fp-ts/function";

export function response(onRight: (a: any) => APIGatewayProxyResult) {
    return function(incoming: TE.TaskEither<Error, any>) {
        return pipe(
            incoming,
            TE.match(
                (error) => {
                    logger.info(error);
                    return error instanceof HttpError
                        ? error.toResponse()
                        : new HttpInternalServerError().toResponse();
                },
                onRight
            )
        )
    }
}