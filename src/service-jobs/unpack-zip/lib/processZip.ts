import { logger } from '@common/utils';
import AdmZip from 'adm-zip';
import { createFolder } from './createFolder';
import { uploadToS3 } from './uploadToS3';

const ignoredFiles = [
    /^._/,
    /^\.DS_Store$/,
    /^\.AppleDouble/,
    /^\.Trashes$/,
    /^\.Spotlight-V100$/,
    /^\.fseventsd$/,
    /^Thumbs.db$/,
    /^desktop.ini$/,
    /^\$RECYCLE.BIN\//,
    /^\.Trash-/,
    /^lost\+found\//,
    /^\.git\//,
    /^\.svn\//,
    /^\.hg\//,
    /^\.lock$/,
    /^~\$/,
];

export async function processZip(
    zip: AdmZip,
    rootFolderId: string,
    s3Key: string,
    bucket: string,
    orgId: string
) {
    logger.debug('processZip', { rootFolderId, s3Key, bucket, orgId });
    const directoryMap = new Map<string, Map<string, string>>();

    async function processEntry(entryPath: string, parentFolderId: string) {
        logger.debug('processEntry', { entryPath, parentFolderId });

        const directChildren = zip.getEntries().filter((e) => {
            const relativePath = e.entryName.replace(entryPath, '');
            const isDirectory = e.entryName.endsWith('/');
            const sanitizedPath = isDirectory
                ? relativePath.slice(0, -1)
                : relativePath;

            return (
                e.entryName.startsWith(entryPath) &&
                !sanitizedPath.includes('/') &&
                e.entryName !== entryPath
            );
        });

        logger.debug('directChildren', { directChildren });

        for (const entry of directChildren) {
            if (ignoredFiles.some((pattern) => pattern.test(entry.name))) {
                continue;
            }

            if (entry.isDirectory) {
                // Generate a new folder ID for the directory based on its name and parentFolderId.
                logger.debug('entry name', { name: entry.name });
                const folderNameParts = entry.entryName
                    .split('/')
                    .filter((p) => p.length > 0);
                logger.debug('entry name parts', { name: folderNameParts });
                const folderName = folderNameParts.pop() ?? entry.name;

                logger.debug('isDirectory', {
                    folderName,
                    parentFolderId,
                    entry,
                });

                if (!folderName) continue;

                try {
                    const doesFolderExist = directoryMap
                        .get(parentFolderId)
                        ?.get?.(folderName);
                    if (doesFolderExist) {
                        await processEntry(entry.entryName, doesFolderExist);
                    } else {
                        const createdFolderId = await createFolder(
                            folderName,
                            parentFolderId,
                            orgId
                        );

                        logger.debug('folderId', { createdFolderId });

                        if (createdFolderId) {
                            directoryMap.set(
                                parentFolderId,
                                (() => {
                                    const folders =
                                        directoryMap.get(parentFolderId) ??
                                        new Map();
                                    folders.set(folderName, createdFolderId);
                                    return folders;
                                })()
                            );

                            await processEntry(
                                entry.entryName,
                                createdFolderId
                            );
                        }
                    }
                } catch (err) {
                    logger.warn('Error processing folder', { err });
                }
            } else {
                const fileName = `${parentFolderId}_${entry.name}`;
                logger.debug('isFile', {
                    parentFolderId,
                    name: entry.name,
                    fileName,
                    key: `${s3Key}/${fileName}`,
                });

                // This'll re-trigger handleJobFile and branch into handleUnzippedFile
                await uploadToS3(
                    bucket,
                    `${s3Key}/${fileName}`,
                    entry.getData()
                );
            }
        }
    }

    // Start the recursive processing from the root
    await processEntry('', rootFolderId);
}
