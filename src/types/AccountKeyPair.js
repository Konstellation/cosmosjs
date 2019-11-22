import bip39 from 'bip39';
import bip32 from 'bip32';
import bech32 from 'bech32';
import secp256k1 from 'secp256k1';
import {ECPair} from 'bitcoinjs-lib';
import KeyStoreV3 from '../utils/crypto/keystore';
import btcaddr from "../utils/crypto/btcaddr";
import {
    DEFAULT_BECH32_PREFIX,
    DEFAULT_KEY_PATH,
} from '../constants';

export default class AccountKeyPair {
    /**
     * Creates key pair
     *
     * @param {string} bech32MainPrefix
     * @param {string} path
     */
    constructor (bech32MainPrefix = DEFAULT_BECH32_PREFIX, path = DEFAULT_KEY_PATH) {
        this.path = path;
        this.bech32MainPrefix = bech32MainPrefix;
    }

    /**
     * Check address validity
     *
     * @param {string} address
     * @param {string} prefix
     * @returns {boolean}
     */
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

    /**
     * Check private key validity
     *
     * @param {string} privateKey
     * @returns {boolean}
     */
    static isValidPrivate (privateKey) {
        return /^[0-9a-fA-F]{64}$/i.test(privateKey);
    }

    /**
     * Generate key pair
     */
    generate () {
        this.mnemonic = bip39.generateMnemonic(256);
        const seed = bip39.mnemonicToSeed(this.mnemonic);
        const node = bip32.fromSeed(seed);
        const child = node.derivePath(this.path);
        this.privateKey = child.privateKey;
    }

    /**
     * Recover key pair from mnemonic words
     *
     * @param {string} mnemonic
     */
    recover (mnemonic) {
        this.checkSeed(mnemonic);

        this.mnemonic = mnemonic;
        const seed = bip39.mnemonicToSeed(this.mnemonic);
        const node = bip32.fromSeed(seed);
        const child = node.derivePath(this.path);
        this.privateKey = child.privateKey;
    }

    /**
     * Set private key
     *
     * @param {Buffer} privateKey
     */
    import (privateKey) {
        if (privateKey.length === 37)
            this.privateKey = Buffer.from(privateKey, 'binary').slice(5, 37);
        else
            this.privateKey = privateKey;
    }

    /**
     * Get mnemonic if defined
     *
     * @returns {string|*}
     */
    getMnemonic () {
        return this.mnemonic;
    }

    /**
     * Resolve address
     *
     * @returns string
     */
    getAddress () {
        let publicKey = this.getPublicKey();
        if (publicKey.length > 33) {
            publicKey = publicKey.slice(5, publicKey.length);
        }

        return bech32.encode(this.bech32MainPrefix, bech32.toWords(btcaddr(publicKey)));
    }

    /**
     * Calc public key from private key
     *
     * @returns {ECPair}
     */
    getECPair () {
        return ECPair.fromPrivateKey(this.privateKey, {
            compressed: false,
        });
    }

    /**
     * Get private key in bytes
     *
     * @returns {Buffer}
     */
    getPrivateKey () {
        return this.privateKey;
    }

    /**
     * Get private key encoded into base64
     * @returns {string}
     */
    getPrivateKeyEncoded () {
        return Buffer.from(this.getPrivateKey(), 'binary')
            .toString('base64');
    }

    /**
     * Get public key encoded into base64
     *
     * @returns {string}
     */
    getPublicKeyEncoded () {
        return Buffer.from(this.getPublicKey(), 'binary')
            .toString('base64');
    }

    /**
     * Get public key in bytes
     *
     * @returns {Buffer}
     */
    getPublicKey () {
        return secp256k1.publicKeyCreate(this.getPrivateKey());
    }

    /**
     * Export account key pair to json
     *
     * @returns {{privateKey, address, mnemonic: string | *, publicKey}}
     */
    toJSON () {
        return {
            mnemonic: this.mnemonic,
            privateKey: this.getPrivateKeyEncoded(),
            publicKey: this.getPublicKeyEncoded(),
            address: this.getAddress(),
        };
    }

    /**
     * Checks mnemonic
     *
     * @param {string} mnemonic
     */
    checkSeed (mnemonic) {
        const seed = mnemonic.split(' ');
        if (seed.length !== 12 && seed.length !== 24) {
            throw new Error('seed length must be equal 12 or 24');
        }
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error('seed is invalid');
        }
    }

    /**
     * Check address validity
     *
     * @returns {boolean}
     */
    isValidAddress () {
        return AccountKeyPair.isValidAddress(this.getAddress(), this.bech32MainPrefix);
    }

    /**
     * Check private key validity
     *
     * @returns {boolean}
     */
    isValidPrivate () {
        return AccountKeyPair.isValidPrivate(this.getPrivateKeyEncoded());
    }

    /**
     * Export key pair to v3 key store
     *
     * @param {string} password
     * @returns {{id: string, version: number, address: string, crypto: Object}}
     */
    toV3KeyStore (password) {
        if (!password) {
            throw new Error('No password given.');
        }

        return new KeyStoreV3().export(this.getPrivateKey(), password, this.getAddress());
    }

    /**
     * Import key pair from v3 key store
     * @param {object} v3Keystore
     * @param {string} password
     */
    fromV3KeyStore (v3Keystore, password) {
        if (!password) {
            throw new Error('No password given.');
        }

        return this.import(new KeyStoreV3().import(v3Keystore, password));
    }
}
