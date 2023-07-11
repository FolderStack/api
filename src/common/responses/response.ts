import { APIGatewayProxyResult } from 'aws-lambda';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { HttpError, HttpInternalServerError } from '../errors';

export function response(onRight: (a: any) => APIGatewayProxyResult) {
    return function (incoming: TE.TaskEither<Error, any>) {
        return pipe(
            incoming,
            TE.match((error) => {
                console.log(error);
                // //logger.info({ err: { ...error } });
                return error instanceof HttpError
                    ? error.toResponse()
                    : new HttpInternalServerError().toResponse();
            }, onRight)
        );
    };
}
