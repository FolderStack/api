import * as crypto from 'crypto';
import { setEngine } from 'pkijs';
import { parseAsn1Structure, parseAttestationResponse } from '../utils';
import { validateAttestationResponse } from './validateAttestationResponse';

setEngine('crypto', crypto as any);

const attestationData = `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`;
const responseData = `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`;

describe('validateAttestationResponse', () => {
    it('should validate the response', async () => {
        const requestData = parseAsn1Structure(attestationData);
        const response = parseAttestationResponse(responseData);

        await validateAttestationResponse(response, requestData);

        // const cmsSignedBuffer = toArrayBuffer(
        //     Buffer.from(responseData, 'base64')
        // );
        // const asn1 = asn1js.fromBER(cmsSignedBuffer);
        // const cmsContentSimpl = new ContentInfo({ schema: asn1.result });
        // const cmsSignedSimpl = new SignedData({
        //     schema: cmsContentSimpl.content,
        // });

        // const AppleRootCA_G3 = new Certificate({
        //     schema: asn1js.fromBER(getAppleRootCA()).result,
        // });

        // const result = await cmsSignedSimpl.verify({
        //     signer: 0,
        //     trustedCerts: [AppleRootCA_G3],
        //     data: cmsSignedSimpl.encapContentInfo.eContent!.valueBlock
        //         .valueHexView,
        //     checkChain: true, // check x509 chain of trust
        //     extendedMode: true, // enable to show signature validation result
        // });

        // console.log(result);

        // const publicKey = response.values.publicKey;
        // const publicRaw = Buffer.from(publicKey).toString('base64');
        // const publicPem = `-----BEGIN CERTIFICATE-----\n${publicRaw}\n-----END CERTIFICATE-----`;
        // // const signature = Buffer.from(
        // //     response.signed.signerInfos[0].signature.valueBlock.valueHexView
        // // );

        // // Extract the value of the eContent field
        // const eContentValue = JSON.stringify(
        //     response.signed.encapContentInfo.eContent!.valueBlock.value
        // );

        // Calculate the SHA-256 hash of the concatenated OCTET STRING values
        // const md = forge.md.sha256.create();
        // md.update(Buffer.from(eContentValue).toString());
        // const messageDigest = md.digest().toHex();

        // const signatureOctets = Buffer.from(
        //     response.signed.signerInfos[0].signature.valueBeforeDecodeView
        // );

        // const signatureBinary = signatureOctets;
        // const signaturePem = forge.pem.encode({
        //     type: 'PKCS7',
        //     body: signatureBinary.toString('binary'),
        // });

        // // Convert the ASN.1 object to PEM format
        // const signature = forge.pkcs7.messageFromPem(signaturePem);
        // console.log(signature);
        // const signerInfo = signature.rawCapture.signerInfos[0];
        // const signatureDigest = signerInfo.encryptedDigest.toHex();
        // if (messageDigest === signatureDigest) {
        //     console.log('Signature is valid');
        // } else {
        //     console.log('Signature is invalid');
        // }

        // console.log(JSON.stringify(response.signed.encapContentInfo.eContent, null, 4))
        // return

        // const content = Buffer.from(
        //     response.signed.encapContentInfo.eContent!.valueBlock
        //         .valueBeforeDecodeView
        // );

        // const verifier = createVerify('sha256');
        // verifier.update(content);

        // const isValid = verifier.verify(publicPem, signature);

        // console.log(
        //     publicPem,
        //     signature.toString('base64'),
        //     Buffer.from(content).toString('base64')
        // );
        // console.log(isValid);

        // expect(
        // await validateAttestationResponse(response, requestData);
        // ).resolves.toBeUndefined();
    });
});