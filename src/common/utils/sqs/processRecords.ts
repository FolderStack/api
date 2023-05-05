import { SQSRecord } from 'aws-lambda';
import * as A from 'fp-ts/Array';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { parseJson } from '../helpers';

type ProcessingFunction<A, B> = (a: A) => TE.TaskEither<Error, B>;

export function processRecords<A = any, B = any>(records: SQSRecord[], process: ProcessingFunction<A, B>) {
    const processRecord = (record: SQSRecord): TE.TaskEither<Error, B> =>
        pipe(
            record.body,
            parseJson<A>,
            TE.fromEither,
            TE.chain(process)
        )
        
    return A.sequence(TE.ApplicativePar)(records.map(processRecord));
}
