import AccountKeyPair from './AccountKeyPair';
import { bech32ifyAccPub, bech32ifyAccPubMulti, unbech32ify } from "../utils/encode/bech32";
import { unmarshalBinaryBare } from "../utils/encode/amino";

export default class AccountMultisig {
    constructor(bech32MainPrefix, path, name, treshold, publicKeys) {
        this.sequence = '';
        this.accountNumber = '';
        // this.keyPair = new AccountKeyPair(bech32MainPrefix, path);
        this.name = name;
        this.treshold = treshold;
        this.publicKeys = publicKeys;
        this.publicKey = [];
    }

    generate() {
        const t = JSON.parse('{"name":"multisig1","public_key":[],"public_keys":["darcpub1addwnpepq0ya2lr46h6suqnxfms8u5eygml9y80qn8u6m6rkju8jk9xdpcsax0yfe4d", "darcpub1addwnpepqfrtpmyzj9hps4n8hdfwtamsj8w782wch66wddeq7tjcgnjv47dfues0ssm", "darcpub1addwnpepq09vvjpvu44vyceug9etgzr95hcvpd5k3cnmtxtj64mssxmed88w65r23zd"],"treshold":3}');
        this.publicKeys = t.public_keys;
        const barePublicKeys = this.publicKeys.map(pk => unbech32ify(pk));

        const multisigPublicKey = {
            treshold: this.treshold,
            public_keys: barePublicKeys,
        };

        const bare = bech32ifyAccPubMulti(multisigPublicKey);
        console.log(bare);

        return this;
    }

    recover(mnemonic) {
        // this.keyPair.recover(mnemonic);

        return this;
    }

    toJSON() {
        return {
            name: this.name,
            public_key: this.publicKey,
            public_keys: this.publicKeys,
            treshold: this.treshold,
        }
    }

    // toV3KeyStore(pass) {
    //     return this.keyPair.toV3KeyStore(pass);
    // }
    //
    // fromV3KeyStore(keyStore, pass) {
    //     this.keyPair.fromV3KeyStore(keyStore, pass);
    //
    //     return this;
    // }

    getAddress() {
        return this.keyPair.getAddress();
    }

    getECPair() {
        return this.keyPair.getECPair();
    }

    getPrivateKey() {
        return this.keyPair.getPrivateKey();
    }

    getPrivateKeyEncoded() {
        return this.keyPair.getPrivateKeyEncoded();
    }

    getPublicKey() {
        return this.keyPair.getPublicKey();
    }

    getPublicKeyEncoded() {
        return this.keyPair.getPublicKeyEncoded();
    }


    // /**
    //  *
    //  * @returns {*}
    //  */
    // getMnemonic() {
    //     return this.keyPair.getMnemonic();
    // }

    /**
     *
     * @param {string} account_number
     * @param {string} sequence
     * @returns {AccountMultisig}
     */
    updateInfo({ account_number, sequence }) {
        this.sequence = sequence;
        this.accountNumber = account_number;

        return this;
    }

    /**
     *
     * @returns {string}
     */
    getSequence() {
        return this.sequence;
    }

    /**
     *
     * @returns {string}
     */
    getAccountNumber() {
        return this.accountNumber;
    }
}
