import { HttpError } from "./http-errors"

export class HttpNotFoundError extends HttpError {
    constructor(
        public readonly error_description?: any,
        public readonly extra?: any
    ) {
        super(404, 'Not Found', error_description, extra)
    }
}