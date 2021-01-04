import StdTx from './StdTx';
import StdSignMsg from './StdSignMsg';
import sign64 from '../utils/crypto/sign64';
import { DEFAULT_DENOM, DEFAULT_FEE, DEFAULT_GAS } from '../constants';
import BaseReq from './BaseReq';
import StdSignature from "./StdSignature";
import Multisignature from "./Multisignature";
import { marshalBinaryBareMULTISIG } from "../utils/encode/amino";

export default class TxBuilder {
    /**
     * Create new tx from stdTx json
     *
     * @param tx {Object}
     * @return {StdTx}
     */
    newTx(tx) {
        const { value } = tx;
        return new StdTx(value);
    }

    /**
     * Create new sig from stdSignature json
     *
     * @param sig {Object}
     * @return {StdSignature}
     */
    newSignature(sig) {
        return StdSignature.fromJSON(sig);
    }

    /**
     * Build std msg prepared for sign
     *
     * @param {Msg} msgs
     * @param fee
     * @param {string} chainId
     * @param {number} gas
     * @param {string} memo
     * @param {number} accountNumber
     * @param {number} sequence

     * @returns {StdSignMsg}
     */
    prepare(msgs, {
        fee = {
            denom: DEFAULT_DENOM,
            amount: DEFAULT_FEE,
        },
        chainId = '',
        gas = DEFAULT_GAS,
        memo = '',
        accountNumber,
        sequence,
    }) {
        if (!msgs) {
            throw new Error('msg object was not set or invalid');
        }
        if (!chainId) {
            throw new Error('chainId object was not set or invalid');
        }
        if (!accountNumber) {
            throw new Error('accountNumber object was not set or invalid');
        }
        if (!sequence) {
            throw new Error('sequence object was not set or invalid');
        }

        return new StdSignMsg({
            msgs,
            fee,
            chainId,
            gas,
            memo,
            accountNumber,
            sequence,
        });
    }

    /**
     * Build tx
     *
     * @param {StdSignMsg} stdSignMsg
     * @returns {StdTx}
     */
    build(stdSignMsg) {
        if (!stdSignMsg) {
            throw new Error('stdSignMsg object was not set or invalid');
        }

        return new StdTx({
            ...stdSignMsg,
        });
    }

    /**
     * Sign message using private key
     *
     * @param {StdSignMsg} stdSignMsg
     * @param privateKey
     * @param {string} publicKey
     * @returns {StdTx}
     */
    signMsg(stdSignMsg, privateKey, publicKey) {
        if (!stdSignMsg) {
            throw new Error('stdSignMsg object was not set or invalid');
        }
        if (!privateKey) {
            throw new Error('privateKey object was not set or invalid');
        }
        if (!publicKey) {
            throw new Error('publicKey object was not set or invalid');
        }

        return new StdTx({
            ...stdSignMsg,
            signatures: [
                {
                    signature: sign64(stdSignMsg, privateKey),
                    pub_key: {
                        type: 'tendermint/PubKeySecp256k1',
                        value: publicKey,
                    },
                },
            ],
        });
    }

    /**
     * Sign tx using private key
     *
     * @param {StdTx} stdTx
     * @param {Buffer} privateKey
     * @param {string} publicKey
     * @param {string} accountNumber
     * @param {string} sequence
     * @param {boolean} signatureOnly
     * @returns {StdTx|Object}
     */
    signTx(stdTx,
           { privateKey, publicKey, accountNumber, sequence },
           { signatureOnly } = { signatureOnly: true }) {
        if (!stdTx) {
            throw new Error('stdTx object was not set or invalid');
        }
        if (!privateKey) {
            throw new Error('privateKey object was not set or invalid');
        }
        if (!publicKey) {
            throw new Error('publicKey object was not set or invalid');
        }

        const { msg, ...txInfo } = stdTx.value;
        const stdSignMsg = this.prepare(msg, {
            ...txInfo,
            accountNumber: 7,
            sequence: 1,
            chainId: 'darchub'
        });

        const signature = {
            signature: sign64(stdSignMsg, privateKey),
            pub_key: {
                type: 'tendermint/PubKeySecp256k1',
                value: publicKey,
            },
        };

        if (signatureOnly) {
            return signature
        }

        return new StdTx({
            ...stdSignMsg,
            signatures: [
                signature
            ],
        });
    }

    /**
     *
     * @param {Array<Buffer>} publicKey
     * @param {StdTx} stdTx
     * @param {Array<StdSignature>} stdSignatures
     * @return StdTx
     */
    multisign(publicKey, stdTx, stdSignatures) {
        if (!publicKey) {
            throw new Error('publicKey object was not set or invalid');
        }
        if (!stdTx) {
            throw new Error('stdTx object was not set or invalid');
        }
        if (!stdSignatures || stdSignatures.length === 0) {
            throw new Error('stdSignatures object was not set or invalid');
        }

        const multisig = new Multisignature(publicKey.public_keys.length);

        stdSignatures.forEach((ss) =>
            multisig.addSignatureFromPubKey(ss.signature, ss.pub_key, publicKey.public_keys));
        stdTx.signatures = [new StdSignature(publicKey, marshalBinaryBareMULTISIG(multisig))];
        console.log(stdTx);
        return stdTx
    }

    /**
     * Build base requirements for the creation tx on the node's side
     *
     * @param fee
     * @param {from} from
     * @param {string} chainId
     * @param {number} gas
     * @param {string} memo
     * @param {number} accountNumber
     * @param {number} sequence
     * @returns {BaseReq}
     */
    baseReq(
        {
            chainId,
            from,
            memo = '',
            accountNumber,
            sequence,
            gas = DEFAULT_GAS,
            fee = {
                denom: DEFAULT_DENOM,
                amount: DEFAULT_FEE,
            },
        },
    ) {
        if (!chainId) {
            throw new Error('chainId object was not set or invalid');
        }
        if (!from) {
            throw new Error('from object was not set or invalid');
        }
        if (!accountNumber) {
            throw new Error('accountNumber object was not set or invalid');
        }
        if (!sequence) {
            throw new Error('sequence object was not set or invalid');
        }

        return new BaseReq({
            chainId,
            from,
            memo,
            accountNumber,
            sequence,
            gas,
            fee,
        });
    }
}
