import Sha256 from 'sha256';
import { sha256, sha224 } from "js-sha256";
import crypto from "crypto";

import RIPEMD160 from 'ripemd160';

/**
 * Convert public key into bitcoin address
 *
 * @param {Buffer} publicKey
 * @returns {Buffer}
 */
export const btcaddr = (publicKey) => (new RIPEMD160().update(
    Buffer.from(Sha256(publicKey, { asBytes: true })),
)).digest();

/**
 * Convert multisig public key into address
 *
 * @param {Buffer} publicKey
 * @returns {Buffer}
 */
export const multisigaddr = (publicKey) => {
    return crypto.createHash('sha256').update(publicKey).digest().slice(0, 20);
};
