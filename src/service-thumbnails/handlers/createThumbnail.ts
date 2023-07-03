import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@common/utils";
import { S3Event } from "aws-lambda";
import { execSync } from 'child_process';

export async function handler(event: S3Event) {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    // Skip processing if the file is already a thumbnail
    if (key.includes('_thumbnail.')) {
        return;
    }

    const params = {
        Bucket: bucket,
        Key: key,
    };

    let inputData;

    try {
        const getObject = new GetObjectCommand(params);
        const s3Object = await s3.send(getObject);
        inputData = s3Object.Body;
    } catch (error) {
        console.log(error);
        return;
    }

    // Add error handling for unsupported file types
    try {
        execSync(`/opt/bin/magick convert -resize 250x250 ${inputData} ${inputData}`);
    } catch (error) {
        console.log(`Error processing file: ${key}`);
        console.log(error);
        return;
    }

    const targetKey = key.replace(/\.[^/.]+$/, '') + '_thumbnail.jpg';

    const putParams = {
        Bucket: bucket,
        Key: targetKey,
        Body: inputData,
        ContentType: "image/jpeg"
    };

    const putObject = new PutObjectCommand(putParams);
    await s3.send(putObject);
};