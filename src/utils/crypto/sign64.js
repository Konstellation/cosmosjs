const secp256k1 = require('secp256k1');
const crypto = require('crypto');

const sortObject = require('../encode/sortObject');

function sign64(msg, privateKey) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(sortObject(msg))).digest('hex');
    const buf = Buffer.from(hash, 'hex');
    const signObj = secp256k1.sign(buf, privateKey);

    return Buffer.from(signObj.signature, 'binary').toString('base64');
}

module.exports = sign64;
