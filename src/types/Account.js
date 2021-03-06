import AccountKeyPair from './AccountKeyPair';

export default class Account {
    constructor (bech32MainPrefix, path) {
        this.sequence = '';
        this.accountNumber = '';
        this.keyPair = new AccountKeyPair(bech32MainPrefix, path);
    }

    generate () {
        this.keyPair.generate();

        return this;
    }

    recover (mnemonic) {
        this.keyPair.recover(mnemonic);

        return this;
    }

    toJSON () {
        return this.keyPair.toJSON();
    }

    toV3KeyStore (pass) {
        return this.keyPair.toV3KeyStore(pass);
    }

    fromV3KeyStore (keyStore, pass) {
        this.keyPair.fromV3KeyStore(keyStore, pass);

        return this;
    }

    getAddress () {
        return this.keyPair.getAddress();
    }

    getECPair () {
        return this.keyPair.getECPair();
    }

    getPrivateKey () {
        return this.keyPair.getPrivateKey();
    }

    getPrivateKeyEncoded () {
        return this.keyPair.getPrivateKeyEncoded();
    }

    getPublicKey () {
        return this.keyPair.getPublicKey();
    }

    getPublicKeyEncoded () {
        return this.keyPair.getPublicKeyEncoded();
    }


    /**
     *
     * @returns {*}
     */
    getMnemonic () {
        return this.keyPair.getMnemonic();
    }

    /**
     *
     * @param {string} account_number
     * @param {string} sequence
     * @returns {Account}
     */
    updateInfo ({account_number, sequence}) {
        this.sequence = sequence;
        this.accountNumber = account_number;

        return this;
    }

    /**
     *
     * @returns {string}
     */
    getSequence () {
        return this.sequence;
    }

    /**
     *
     * @returns {string}
     */
    getAccountNumber () {
        return this.accountNumber;
    }
}
