import StdTx from './StdTx';
import StdSignMsg from './StdSignMsg';
import sign64 from '../crypto/sign64';

export default class TxBuilder {
    build(msgs, txInfo) {
        return new StdSignMsg({
            msgs,
            ...txInfo,
        });
    }

    sign(stdSignMsg, privateKey, publicKey) {
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
