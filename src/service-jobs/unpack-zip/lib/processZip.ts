import { logger } from "@common/utils";
import AdmZip from "adm-zip";
import { uploadToS3 } from "./uploadToS3";

export async function processZip(zip: AdmZip, folderId: string, s3Key: string, bucket: string) {
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
        /^~\$/
    ];

    const zipEntries = zip.getEntries();

    const topLevelEntries = zipEntries.filter(entry => {
        const depth = entry.entryName.split('/').length;
        return depth === 1 || (depth === 2 && entry.isDirectory); // account for the trailing / in directories
    });

    logger.debug('Iterating through zip entries...')
    for (const entry of topLevelEntries) {
        logger.debug('Entry name: ' + entry.name);
        logger.debug('Entry path: ' + entry.entryName);
        if (ignoredFiles.some(pattern => pattern.test(entry.name))) {
            logger.debug('File is being ignored: ' + entry.entryName);
            continue;
        }

        if (entry.isDirectory) {
            logger.debug('Is a directory...')
            const newZip = new AdmZip();

            // Get the nested entries for this directory
            const nestedEntries = zipEntries.filter(nestedEntry =>
                nestedEntry.entryName.startsWith(entry.entryName) && nestedEntry.entryName !== entry.entryName);

            logger.debug(`Found ${nestedEntries.length} nested entries in the directory`)
            for (const nestedEntry of nestedEntries) {
                if (nestedEntry.isDirectory) {
                    // If you want, add the subdirectories as well, but you might opt to skip this since another Lambda will handle it.
                    continue;
                }
                const read = zip.readFile(nestedEntry);
                if (!read) continue;

                newZip.addFile(nestedEntry.entryName, read);
            }

            // Now, upload this new ZIP to S3 to trigger another Lambda
            const newZipName = `${folderId}_${entry.name}.zip`; // Prefix with folderId
            logger.debug(`Uploading new zip of directory to: ${s3Key}/${newZipName}`);
            await uploadToS3(bucket, `${s3Key}/${newZipName}`, newZip.toBuffer());
        } else {
            // Handle top-level files, prefixing them with the folderId
            logger.debug('Is a file...')
            
            const fileName = `${folderId}_${entry.name}`;

            logger.debug(`Unpacking to: ${s3Key}/${fileName}`);
            await uploadToS3(bucket, `${s3Key}/${fileName}`, entry.getData());
        }
    }
}