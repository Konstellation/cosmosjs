import {
    bech32ifyAccAddr,
    bech32ifyAccPub,
    unbech32ify
} from "../utils/encode/bech32";
import {
    marshalBinaryBare,
    PubKeyMultisigThreshold,
} from "../utils/encode/amino";
import btcaddr from "../utils/crypto/btcaddr";
import { multisigaddr } from "../utils/crypto/addr";

export default class AccountMultisig {
    constructor(bech32MainPrefix, path, name, threshold, publicKeys = [], nosort) {
        this.sequence = '';
        this.accountNumber = '';
        this.name = name;
        this.threshold = threshold;

        let pks = publicKeys.map(pk => unbech32ify(pk).payload);

        if (nosort) {
            // console.log(JSON.stringify(pks));
            pks = pks.sort((a, b) => {
                // console.log(btcaddr(a));
                // console.log(btcaddr(b));
                // console.log(Buffer.from(btcaddr(a)).compare(Buffer.from(btcaddr(b))));
                return Buffer.from(btcaddr(a)).compare(Buffer.from(btcaddr(b))) < 0
            });
            // console.log(JSON.stringify(pks));
        }

        this.publicKey = {
            threshold: this.threshold,
            public_keys: pks,
        };
    }

    fromJSON({ public_keys, name }) {
        this.threshold = public_keys.threshold;
        this.name = name;
        this.publicKey = {
            threshold: public_keys.threshold,
            public_keys: public_keys.public_keys,
        };

        return this;
    }

    toJSON() {
        return {
            name: this.name,
            public_key: this.getPublicKeyEncoded(),
            public_keys: this.getPublicKey(),
            address: this.getAddress()
        }
    }

    getAddress() {
        return bech32ifyAccAddr(multisigaddr(marshalBinaryBare(this.publicKey, PubKeyMultisigThreshold)));
    }

    getPublicKey() {
        return this.publicKey;
    }

    getPublicKeyEncoded() {
        return bech32ifyAccPub(marshalBinaryBare(this.publicKey, PubKeyMultisigThreshold), 250)
    }

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
