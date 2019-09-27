export default class StdTx {
    constructor ({
                     msgs,
                     memo,
                     signatures,
                     fee,
                 }) {
        return {
            msg: msgs,
            fee,
            signatures,
            memo,
        };
    }
}
