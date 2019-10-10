import bip39 from 'bip39';
import bip32 from 'bip32';
import bech32 from 'bech32';
import secp256k1 from 'secp256k1';
import {ECPair} from 'bitcoinjs-lib';
import Sha256 from 'sha256';
import RIPEMD160 from 'ripemd160';
import web3Utils from 'web3-utils';
import scryptsy from 'scrypt.js';
import uuid from 'uuid';
import crypto from 'crypto';

import {
    DEFAULT_BECH32_PREFIX,
    DEFAULT_KEY_PATH,
} from '../utils/constants';

export default class AccountKeyPair {
    constructor (bech32MainPrefix, path) {
        this.path = path || DEFAULT_KEY_PATH;
        this.bech32MainPrefix = bech32MainPrefix || DEFAULT_BECH32_PREFIX;
    }

    generate () {
        this.mnemonic = bip39.generateMnemonic(256);
        this.seed = bip39.mnemonicToSeed(this.mnemonic);
        this.node = bip32.fromSeed(this.seed);
        this.child = this.node.derivePath(this.path);
        this.privateKey = this.child.privateKey;
    }

    recover (mnemonic) {
        this.checkSeed(mnemonic);

        this.mnemonic = mnemonic;
        this.seed = bip39.mnemonicToSeed(this.mnemonic);
        this.node = bip32.fromSeed(this.seed);
        this.child = this.node.derivePath(this.path);
        this.privateKey = this.child.privateKey;
    }

    import (privateKey) {
        this.privateKey = privateKey;
    }

    getMnemonic () {
        return this.mnemonic;
    }

    getAddress () {
        let publicKey = this.getPublicKey();
        if (publicKey.length > 33) {
            publicKey = publicKey.slice(5, publicKey.length);
        }

        const hmac = Sha256(publicKey, {asBytes: true});
        const addr = (new RIPEMD160().update(Buffer.from(hmac))).digest();
        const words = bech32.toWords(addr);

        return bech32.encode(this.bech32MainPrefix, words);
    }

    getECPair () {
        return ECPair.fromPrivateKey(this.privateKey, {
            compressed: false,
        });
    }

    getPrivateKey () {
        return this.privateKey;
    }

    getPrivateKeyEncoded () {
        return Buffer.from(this.getPrivateKey(), 'binary')
            .toString('base64');
    }

    getPublicKeyEncoded () {
        return Buffer.from(this.getPublicKey(), 'binary')
            .toString('base64');
    }

    getPublicKey () {
        return secp256k1.publicKeyCreate(this.getPrivateKey());
    }

    toJSON () {
        return {
            mnemonic: this.mnemonic,
            privateKey: this.getPrivateKeyEncoded(),
            publicKey: this.getPublicKeyEncoded(),
            address: this.getAddress(),
        };
    }

    checkSeed (mnemonic) {
        const seed = mnemonic.split(' ');
        if (seed.length !== 12 && seed.length !== 24) {
            throw new Error('seed length must be equal 12 or 24');
        }
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error('seed is invalid');
        }
    }

    isValidAddress () {
        return AccountKeyPair.isValidAddress(this.getAddress(), this.bech32MainPrefix);
    }

    static isValidAddress (address, prefix = DEFAULT_BECH32_PREFIX) {
        const preReg = new RegExp(`^${prefix}1`);
        if (!preReg.test(address)) {
            return false;
        }

        const allReg = new RegExp(/^[0-9a-zA-Z]*$/i);
        if (!allReg.test(address)) {
            return false;
        }

        try {
            bech32.decode(address);
            return true;
        } catch (e) {
            return false;
        }
    }

    isValidPrivate () {
        return AccountKeyPair.isValidPrivate(this.getPrivateKeyEncoded())
    }

    static isValidPrivate (privateKey) {
        return /^[0-9a-fA-F]{64}$/i.test(privateKey);
    }

    toV3KeyStore (password) {
        const salt = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        let derivedKey;
        const kdf = 'scrypt';
        const kdfparams = {
            dklen: 32,
            salt: salt.toString('hex'),
        };

        if (kdf === 'pbkdf2') {
            kdfparams.c = 262144;
            kdfparams.prf = 'hmac-sha256';
            derivedKey = crypto.pbkdf2Sync(Buffer.from(password), salt, kdfparams.c, kdfparams.dklen, 'sha256');
        } else if (kdf === 'scrypt') {
            kdfparams.n = 8192;
            kdfparams.r = 8;
            kdfparams.p = 1;
            derivedKey = scryptsy(
                Buffer.from(password),
                salt,
                kdfparams.n,
                kdfparams.r,
                kdfparams.p,
                kdfparams.dklen,
            );
        } else {
            throw new Error('Unsupported kdf');
        }

        const cipher = crypto.createCipheriv('aes-128-ctr', derivedKey.slice(0, 16), iv);
        if (!cipher) {
            throw new Error('Unsupported cipher');
        }

        const ciphertext = Buffer.concat([cipher.update(this.getPrivateKey()), cipher.final()]);
        const mac = web3Utils.sha3(Buffer.concat([derivedKey.slice(16, 32), Buffer.from(ciphertext, 'hex')])).replace('0x', '');

        return {
            version: 3,
            id: uuid.v4({
                random: crypto.randomBytes(16),
            }),
            address: this.getAddress(),
            crypto: {
                ciphertext: ciphertext.toString('hex'),
                cipherparams: {
                    iv: iv.toString('hex'),
                },
                cipher: 'aes-128-ctr',
                kdf,
                kdfparams,
                mac: mac.toString('hex'),
            },
        };
    }

    fromV3KeyStore (v3Keystore, password, nonStrict) {
        nonStrict = nonStrict || false;
        if (!password) {
            throw new Error('No password given.');
        }

        const json = typeof v3Keystore === 'object' ? v3Keystore : JSON.parse(nonStrict ? v3Keystore.toLowerCase() : v3Keystore);
        if (json.version !== 3) {
            throw new Error('Not a valid V3 wallet');
        }

        let derivedKey;
        const {kdfparams, kdf} = json.crypto;
        if (kdf === 'scrypt') {
            derivedKey = scryptsy(
                Buffer.from(password),
                Buffer.from(kdfparams.salt, 'hex'),
                kdfparams.n,
                kdfparams.r,
                kdfparams.p,
                kdfparams.dklen,
            );
        } else if (kdf === 'pbkdf2') {
            if (kdfparams.prf !== 'hmac-sha256') {
                throw new Error('Unsupported parameters to PBKDF2');
            }
            derivedKey = crypto.pbkdf2Sync(
                Buffer.from(password),
                Buffer.from(kdfparams.salt, 'hex'),
                kdfparams.c,
                kdfparams.dklen,
                'sha256',
            );
        } else {
            throw new Error('Unsupported key derivation scheme');
        }

        const ciphertext = Buffer.from(json.crypto.ciphertext, 'hex');
        const mac = web3Utils.sha3(Buffer.concat([derivedKey.slice(16, 32), ciphertext])).replace('0x', '');
        if (mac !== json.crypto.mac) {
            throw new Error('Key derivation failed - possibly wrong password');
        }

        const decipher = crypto.createDecipheriv(
            json.crypto.cipher,
            derivedKey.slice(0, 16),
            Buffer.from(json.crypto.cipherparams.iv, 'hex'),
        );
        const privateKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

        return this.import(privateKey);
    }
}
