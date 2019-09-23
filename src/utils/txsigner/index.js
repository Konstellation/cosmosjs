const {sign64} = require('../crypto');

module.exports = class TxSigner {
    constructor() {

    }

    sign(tx, privateKey, publicKey) {
        let signData = {...tx.tx, msgs: tx.tx.msg};
        delete signData.msg;

        tx.tx.signatures = [{
            "signature": sign64(signData, privateKey),
            "pub_key": {
                "type": "tendermint/PubKeySecp256k1",
                "value": publicKey
            }
        }];

        return tx
    }
};