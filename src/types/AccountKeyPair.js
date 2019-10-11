import bip39 from 'bip39';
import bip32 from 'bip32';
import bech32 from 'bech32';
import secp256k1 from 'secp256k1';
import {ECPair} from 'bitcoinjs-lib';

import {
    DEFAULT_BECH32_PREFIX,
    DEFAULT_KEY_PATH,
} from '../utils/constants';
import KeyStoreV3 from '../utils/crypto/keystore';
import btcaddr from "../utils/crypto/btcaddr";

export default class AccountKeyPair {
    constructor (bech32MainPrefix, path) {
        this.path = path || DEFAULT_KEY_PATH;
        this.bech32MainPrefix = bech32MainPrefix || DEFAULT_BECH32_PREFIX;
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

    static isValidPrivate (privateKey) {
        return /^[0-9a-fA-F]{64}$/i.test(privateKey);
    }

    generate () {
        this.mnemonic = bip39.generateMnemonic(256);
        const seed = bip39.mnemonicToSeed(this.mnemonic);
        const node = bip32.fromSeed(seed);
        const child = node.derivePath(this.path);
        this.privateKey = child.privateKey;
    }

    recover (mnemonic) {
        this.checkSeed(mnemonic);

        this.mnemonic = mnemonic;
        const seed = bip39.mnemonicToSeed(this.mnemonic);
        const node = bip32.fromSeed(seed);
        const child = node.derivePath(this.path);
        this.privateKey = child.privateKey;
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

        return bech32.encode(this.bech32MainPrefix, bech32.toWords(btcaddr(publicKey)));
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

    isValidPrivate () {
        return AccountKeyPair.isValidPrivate(this.getPrivateKeyEncoded());
    }

    toV3KeyStore (password) {
        if (!password) {
            throw new Error('No password given.');
        }

        return new KeyStoreV3().export(this.getPrivateKey(), password, this.getAddress());
    }

    fromV3KeyStore (v3Keystore, password, nonStrict) {
        if (!password) {
            throw new Error('No password given.');
        }

        return this.import(new KeyStoreV3().import(v3Keystore, password, nonStrict));
    }
}
