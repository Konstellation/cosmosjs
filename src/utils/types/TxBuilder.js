const sign64 = require('../crypto/sign64');
const StdSignMsg = require('../types/StdSignMsg');
const StdTx = require('./StdTx');

module.exports = class TxBuilder {
    constructor() {
    }

    build(msgs, txInfo) {
        return new StdSignMsg({
            msgs,
            ...txInfo
        });
    }

    sign(stdSignMsg, privateKey, publicKey) {
        return new StdTx({
            ...stdSignMsg,
            signatures: [
                {
                    "signature": sign64(stdSignMsg, privateKey),
                    "pub_key": {
                        "type": "tendermint/PubKeySecp256k1",
                        "value": publicKey
                    }
                }
            ]
        });
    }
};
