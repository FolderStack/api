import { Archiver } from 'archiver';
import { archiveFiles } from './archiveFiles';
import { archiveFolder } from './archiveFolder';

export function zipFolder(
    archiver: Archiver,
    zipKey: string,
    folderId: string,
    org: string
) {
    return archiveFolder(archiver, zipKey, folderId, org);
}

export function zipSelection(
    archiver: Archiver,
    zipKey: string,
    fileIds: string[],
    orgId: string
) {
    return archiveFiles(archiver, zipKey, fileIds, orgId);
}
