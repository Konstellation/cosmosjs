import base64 from 'base64-node';

export default class StdSignature {

    /**
     *
     * @class
     * @constructor
     * @public
     * @param {Object} pub_key
     * @param {Buffer} signature
     */
    constructor(pub_key, signature) {
        /**
         * @type {Object}
         * @public
         */
        this.pub_key = pub_key;
        /**
         * @type {Buffer}
         * @public
         */
        this.signature = signature;
    }

    /**
     *
     * @param {Object} pub_key
     * @param {string} signature
     * @return StdSignature
     */
    static fromJSON({ pub_key: { value }, signature }) {
        return new StdSignature(Buffer.from(value, 'base64'), Buffer.from(signature, 'base64'))
    }

    toJSON() {
        return {
            signature: this.signature.toString('base64'),
            pub_key: {
                type: 'tendermint/PubKeyMultisigThreshold',
                value: {
                    pubkeys: this.pub_key.public_keys.map(pk => ({
                        type: 'tendermint/PubKeySecp256k1',
                        value: Buffer.from(pk).toString('base64')
                    })),
                    threshold: String(this.pub_key.threshold),
                }
            }
    }
    }
}
