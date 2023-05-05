import { HttpError } from "./http-errors"

export class HttpUnauthorizedError extends HttpError {
    constructor(
        public readonly error_description?: any,
        public readonly extra?: any
    ) {
        super(401, 'Unauthorized', error_description, extra)
    }
}