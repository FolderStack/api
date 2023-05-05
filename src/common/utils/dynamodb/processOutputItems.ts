import { QueryCommandOutput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { HttpInternalServerError } from '../../errors';

export const processOutputItems = <T>(data: ScanCommandOutput | QueryCommandOutput): E.Either<Error, T[]> =>
    pipe(
        E.tryCatch(
            () => (data.Items ?? []).map((item) => unmarshall(item) as T),
            (): Error => new HttpInternalServerError('Unable to process data')
        )
    );
