import scryptsy from 'scrypt.js';
import cryptojs from 'crypto';
import web3Utils from 'web3-utils';
import {v4} from 'uuid';

export const VERSION = 3;
export const DKLEN = 32;
export const SALT_SIZE = 32;
export const IV_SIZE = 16;
export const ID_SIZE = 16;
export const SCRYPT = 'scrypt';
export const SCRYPT_N = 8192;
export const SCRYPT_R = 8;
export const SCRYPT_P = 1;
export const PBKDF2_C = 262144;
export const PRF = 'hmac-sha256';
export const PBKDF2 = 'pbkdf2';
export const SHA256 = 'sha256';
export const AES128CTR = 'aes-128-ctr';

class KDF {
    /**
     * Creates key derivation function
     *
     * @param {Buffer|string} salt
     * @param {number} dklen
     */
    constructor({salt, dklen = DKLEN}) {
        if (typeof salt === 'string') {
            salt = Buffer.from(salt, 'hex');
        }

        this.salt = salt;
        this.dklen = dklen;
    }

    /**
     * Derive key
     */
    getDerivedKey() {
        throw new Error('Not implemented');
    }

    /**
     * Get kdf params
     */
    getKdfParams() {
        throw new Error('Not implemented');
    }
}

class ScryptKdf extends KDF {
    /**
     * Creates key derivation function based on scrypt
     *
     * @param {number} n
     * @param {number} r
     * @param {number} p
     * @param {number} dklen
     * @param {Buffer|string} salt
     */
    constructor({n = SCRYPT_N, r = SCRYPT_R, p = SCRYPT_P, dklen, salt}) {
        super({salt, dklen});
        this.kdfparams = {
            n,
            r,
            p,
        };
    }

    /**
     * Derive key
     *
     * @param {string} password
     * @returns {Buffer}
     */
    getDerivedKey(password) {
        return scryptsy(
            Buffer.from(password),
            this.salt,
            this.kdfparams.n,
            this.kdfparams.r,
            this.kdfparams.p,
            this.dklen,
        );
    }

    /**
     * Get kdf params
     *
     * @returns {{p: number, r: number, salt: string, dklen: number, n: number}}
     */
    getKdfParams() {
        return {
            salt: this.salt.toString('hex'),
            n: this.kdfparams.n,
            r: this.kdfparams.r,
            p: this.kdfparams.p,
            dklen: this.dklen,
        };
    }
}

class Pbkdf2Kdf extends KDF {
    /**
     * Creates key derivation function based on pbkdf2
     *
     * @param {string} prf
     * @param {number} c
     * @param {number} dklen
     * @param {string} digest
     * @param {Buffer|string} salt
     */
    constructor({prf = PRF, c = PBKDF2_C, dklen = DKLEN, digest = SHA256, salt}) {
        super({dklen, salt});
        this.kdfparams = {
            prf,
            c,
        };
        this.digest = digest;
    }

    /**
     * Derive key
     *
     * @param {string} password
     * @returns {Buffer}
     */
    getDerivedKey(password) {
        if (this.kdfparams.prf !== PRF) {
            throw new Error('Unsupported parameters to PBKDF2');
        }

        return cryptojs.pbkdf2Sync(
            Buffer.from(password),
            this.salt,
            this.kdfparams.c,
            this.dklen,
            this.digest,
        );
    }

    /**
     * Get kdf params
     *
     * @returns {{salt: string, c: number, prf: string, dklen: number}}
     */
    getKdfParams() {
        return {
            salt: this.salt.toString('hex'),
            c: this.kdfparams.c,
            dklen: this.dklen,
            prf: this.kdfparams.prf,
        };
    }
}


export default class KeyStoreV3 {
    /**
     * Import keystore
     *
     * @param {object|string} v3Keystore
     * @param {string} password
     * @param {boolean} nonStrict
     * @returns {Buffer} privateKey
     */
    import(v3Keystore, password, nonStrict = false) {
        if (!password) {
            throw new Error('No password given.');
        }

        const {version, crypto} = typeof v3Keystore === 'object'
            ? v3Keystore
            : JSON.parse(nonStrict
                ? v3Keystore.toLowerCase()
                : v3Keystore
            );
        if (version !== VERSION) {
            throw new Error('Not a valid V3 wallet');
        }

        const derivedKey = this.getKdf(crypto).getDerivedKey(password);
        const cipherText = this.getCipherText(crypto, derivedKey);
        return this.decrypt(crypto, derivedKey, cipherText);
    }

    /**
     * Export keystore
     *
     * @param {Buffer} privateKey
     * @param {string} password
     * @param {string} address
     * @param {string} cipher
     * @param {string} kdf
     * @param {number} dklen
     * @param {Buffer} salt
     * @param {Buffer} iv
     * @returns {{id: string, version: number, address:string, crypto:object}}
     */
    export(
        privateKey,
        password,
        address,
        {
            cipher = AES128CTR,
            kdf = SCRYPT,
            dklen = DKLEN,
            salt = cryptojs.randomBytes(SALT_SIZE),
            iv = cryptojs.randomBytes(IV_SIZE),
        } = {}
    ) {
        if (!password) {
            throw new Error('No password given.');
        }

        const keyDF = this.getKdf({kdf, kdfparams: {dklen, salt}});
        const derivedKey = keyDF.getDerivedKey(password);
        const ciphertext = this.encrypt(derivedKey, privateKey, {iv});
        const mac = this.checksum(derivedKey, ciphertext);

        return {
            version: VERSION,
            id: v4({
                random: cryptojs.randomBytes(ID_SIZE),
            }),
            address,
            crypto: {
                ciphertext: ciphertext.toString('hex'),
                cipherparams: {
                    iv: iv.toString('hex'),
                },
                cipher,
                kdf,
                kdfparams: keyDF.getKdfParams(),
                mac: mac.toString('hex'),
            },
        };
    }

    /**
     * Get key derivation function
     *
     * @param kdf
     * @param kdfparams
     * @returns {KDF}
     */
    getKdf({kdf, kdfparams}) {
        switch (kdf) {
            case SCRYPT:
                return new ScryptKdf(kdfparams);
            case PBKDF2:
                return new Pbkdf2Kdf(kdfparams);
            default:
                throw new Error('Unsupported key derivation scheme');
        }
    }

    /**
     * Resolve and check cipher text from key store
     *
     * @param cipherTextHex
     * @param mac
     * @param derivedKey
     * @returns {Buffer}
     */
    getCipherText({ciphertext, mac}, derivedKey) {
        const cipherText = Buffer.from(ciphertext, 'hex');
        const macCheck = web3Utils.sha3(Buffer.concat([derivedKey.slice(16, 32), cipherText])).replace('0x', '');
        if (macCheck !== mac) {
            throw new Error('Key derivation failed - possibly wrong password');
        }

        return cipherText;
    }

    /**
     * Create checksum for ciphertext
     *
     * @param derivedKey
     * @param ciphertext
     * @returns {Buffer}
     */
    checksum(derivedKey, ciphertext) {
        return web3Utils.sha3(Buffer.concat([derivedKey.slice(16, 32), Buffer.from(ciphertext, 'hex')])).replace('0x', '');
    }

    /**
     * Encrypt data with key
     *
     * @param derivedKey
     * @param data
     * @param cipherAlg
     * @param iv
     * @returns {Buffer}
     */
    encrypt(derivedKey, data, {cipherAlg = AES128CTR, iv}) {
        const cipher = cryptojs.createCipheriv(cipherAlg, derivedKey.slice(0, 16), iv);
        if (!cipher) {
            throw new Error('Unsupported cipher');
        }

        return Buffer.concat([cipher.update(data), cipher.final()]);
    }

    /**
     * Decrypt ciphertext
     *
     * @param cipher
     * @param iv
     * @param derivedKey
     * @param cipherText
     * @returns {Buffer}
     */
    decrypt({cipher, cipherparams: {iv}}, derivedKey, cipherText) {
        const decipher = cryptojs.createDecipheriv(
            cipher,
            derivedKey.slice(0, 16),
            Buffer.from(iv, 'hex'),
        );

        return Buffer.concat([decipher.update(cipherText), decipher.final()]);
    }
}
