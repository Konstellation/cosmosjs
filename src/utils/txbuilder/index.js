const Tx = require('../tx');

module.exports = class TxBuilder {
    constructor() {
    }

    build(msg, txInfo, mode) {
        return new Tx({
            msg,
            ...txInfo,
            mode
        });
    }
};