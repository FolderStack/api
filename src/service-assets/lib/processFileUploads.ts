import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { createFile } from './db/createFile'
import { FileUpload, IFileRecord } from './type'

export function processFileUploads(
  folder: string, 
  fileUploads: FileUpload[],
  org: string
): TE.TaskEither<Error, IFileRecord[]> {
    return pipe(
        fileUploads,
        A.map(upload => {
            const { name, file, fileType, fileSize } = upload
            return createFile(name, file, fileSize, fileType, folder, org) // use chainW to widen the error type
        }),
        TE.sequenceArray, // Convert Array<TaskEither> to TaskEither<Array>
        TE.map(results => results.filter(result => result !== null)) // Removes any null results
    )
}
