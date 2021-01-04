export default class StdTx {
    constructor({ msgs, memo, signatures = null, fee, msg }) {
        this.msg = msgs;
        if (!msgs && msg) {
            this.msg = msg;
        }
        this.fee = fee;

        /**
         * @type {Array<StdSignature>}
         * @public
         */
        this.signatures = signatures;
        this.memo = memo;
    }

    raw() {
        let sigs = this.signatures;
        if(this.signatures) {
            const [{pub_key}] = this.signatures;
            if (pub_key.type !== 'tendermint/PubKeySecp256k1') {
                sigs = this.signatures.map(s => s.toJSON());
            }
        }

        const msg = this.msg.type ? [{ type: this.msg.type, value: { ...this.msg } }] : this.msg;
        return {
            type: 'cosmos-sdk/StdTx',
            value: {
                msg,
                fee: this.fee,
                signatures: sigs,
                memo: this.memo,
            }
        }
    }

    toJSON() {
        const { value } = this.raw();

        return value
    }
}
