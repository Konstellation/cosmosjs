import secp256k1 from 'secp256k1';
import crypto from 'crypto';
import sortObject from '../encode/sortObject';

/**
 * Signs msg with private key
 *
 * @param {object} msg
 * @param {Buffer} privateKey
 * @returns {string}
 */
export default (msg, privateKey) => {
    const sorted = sortObject(msg);
    const json = JSON.stringify(sorted);
    const hash = crypto.createHash('sha256').update(json).digest();
    const signObj = secp256k1.sign( Buffer.from(hash), privateKey);

    return Buffer.from(signObj.signature, 'binary').toString('base64');
}
