import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger, s3 } from '@common/utils';
import { S3Event } from 'aws-lambda';
import { execSync } from 'child_process';
import { createWriteStream, existsSync, promises as fs, statSync } from 'fs';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { Readable } from 'stream';

const THUMB_KEY = '__fsthumb';

export async function handler(event: S3Event) {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, ' ')
    );

    // Skip processing if the file is already a thumbnail
    if (key.includes(THUMB_KEY)) {
        return;
    }

    const params = {
        Bucket: bucket,
        Key: key,
    };

    let inputData;

    const extension = extname(key);
    const inputPath = join(tmpdir(), `input${extension}`);
    try {
        const getObject = new GetObjectCommand(params);
        logger.debug({ getObject });
        const s3Object = await s3.send(getObject);

        logger.debug({ bucket, key });

        if (!s3Object.Body) {
            throw new Error('No body in s3 object');
        }

        await new Promise((resolve, reject) => {
            if (s3Object.Body instanceof Readable) {
                s3Object.Body.pipe(createWriteStream(inputPath))
                    .on('error', (err) => reject(err))
                    .on('close', () => resolve(null));
            }
        });

        const stats = statSync(inputPath);
        const fileSizeInBytes = stats.size;

        logger.debug('File stats', { stats });

        if (fileSizeInBytes === 0) {
            logger.debug('File is 0 bytes. exiting early...');
            return;
        }
    } catch (error) {
        logger.warn(error);
        return;
    }

    // Add error handling for unsupported file types
    try {
        const outputPath = join(tmpdir(), 'output.png');

        logger.info(`Input path: ${inputPath}`);
        logger.info(`Output path: ${outputPath}`);

        if (!existsSync(inputPath)) {
            throw new Error('Input file not found');
        }

        const magickVersion = execSync('/opt/bin/magick -version').toString();
        logger.debug(`ImageMagick Version: ${magickVersion}`);

        execSync(
            `/opt/bin/magick convert -resize 350x350 ${inputPath} ${outputPath}`
        );
        inputData = await fs.readFile(outputPath);
    } catch (error) {
        logger.warn(error);
        return;
    }

    const targetKey = key.replace(/\.[^/.]+$/, '') + THUMB_KEY + '.png';

    const putParams = {
        Bucket: bucket,
        Key: targetKey,
        Body: inputData,
        ContentType: 'image/png',
    };

    const putObject = new PutObjectCommand(putParams);
    await s3.send(putObject);
}
