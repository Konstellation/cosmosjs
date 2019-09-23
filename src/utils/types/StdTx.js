module.exports = class Tx {
    constructor({msgs, memo, signatures, fee}) {
        return {
            msg: msgs,
            fee,
            signatures,
            memo
        }
    }
};
