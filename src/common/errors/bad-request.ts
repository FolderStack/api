import { HttpError } from "./http-errors"

export class HttpBadRequestError extends HttpError {
    constructor(
        public readonly error_description?: any,
        public readonly extra?: any
    ) {
        super(400, 'Bad Request', error_description, extra)
    }
}