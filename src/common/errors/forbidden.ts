import { HttpError } from "./http-errors"

export class HttpForbiddenError extends HttpError {
    constructor(
        public readonly error_description?: any,
        public readonly extra?: any
    ) {
        super(403, 'Forbidden', error_description, extra)
    }
}