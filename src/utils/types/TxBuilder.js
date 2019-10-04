import StdTx from './StdTx';
import StdSignMsg from './StdSignMsg';
import sign64 from '../crypto/sign64';
import {DEFAULT_DENOM, DEFAULT_FEE, DEFAULT_GAS} from '../constants';

export default class TxBuilder {
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
    build (msgs, {
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
     * Sign message using private key
     *
     * @param {StdSignMsg} stdSignMsg
     * @param privateKey
     * @param {string} publicKey
     * @returns {StdTx}
     */
    sign (stdSignMsg, privateKey, publicKey) {
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
}
