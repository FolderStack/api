import { HttpError } from './http-errors';

export class HttpInternalServerError extends HttpError {
    constructor(
        public readonly error_description?: any,
        public readonly extra?: any
    ) {
        super(500, 'Internal Server Error', error_description, extra);
        //logger.error(this.stack);
    }
}
