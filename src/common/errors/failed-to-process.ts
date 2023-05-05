import { HttpError } from "./http-errors"

export class HttpFailedToProcessError extends HttpError {
    constructor(
        public readonly error_description?: any,
        public readonly extra?: any
    ) {
        super(500, 'Failed to process', error_description, extra)
    }
}