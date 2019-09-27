import secp256k1 from 'secp256k1';
import crypto from 'crypto';
import sortObject from '../encode/sortObject';

function sign64(msg, privateKey) {
    const hash = crypto.createHash('sha256')
        .update(JSON.stringify(sortObject(msg)))
        .digest('hex');
    const buf = Buffer.from(hash, 'hex');
    const signObj = secp256k1.sign(buf, privateKey);

    return Buffer.from(signObj.signature, 'binary')
        .toString('base64');
}

export default sign64;
