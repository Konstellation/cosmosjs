const bip39 = require('bip39');
const bip32 = require('bip32');
const bech32 = require('bech32');
const secp256k1 = require('secp256k1');
const bitcoinjs = require('bitcoinjs-lib');

module.exports = class Account {
    constructor(path, bech32MainPrefix) {
        this.path = path || "m/44'/118'/0'/0/0";
        this.bech32MainPrefix = bech32MainPrefix || "darc";
        this.sequence = '';
        this.accountNumber = '';
    }

    generate() {
        this.mnemonic = bip39.generateMnemonic(256);
        this.seed = bip39.mnemonicToSeed(this.mnemonic);
        this.node = bip32.fromSeed(this.seed);
        this.child = this.node.derivePath(this.path);
        return this;
    }

    recover(mnemonic) {
        this.mnemonic = mnemonic;
        this.seed = bip39.mnemonicToSeed(this.mnemonic);
        this.node = bip32.fromSeed(this.seed);
        this.child = this.node.derivePath(this.path);
        return this;
    }

    getAddress() {
        const words = bech32.toWords(this.child.identifier);
        return bech32.encode(this.bech32MainPrefix, words);
    }

    getECPair() {
        return bitcoinjs.ECPair.fromPrivateKey(this.child.privateKey, {
            compressed: false
        })
    }

    getPrivateKey() {
        return this.child.privateKey;
    }

    getPublicKey() {
        const pubKeyByte = secp256k1.publicKeyCreate(this.child.privateKey);
        return Buffer.from(pubKeyByte, 'binary').toString('base64');
    }

    updateInfo({account_number, sequence}) {
        this.sequence = sequence;
        this.accountNumber = account_number;

        return this;
    }

    getSequence() {
        return this.sequence;
    }

    getAccountNumber() {
        return this.accountNumber;
    }
};