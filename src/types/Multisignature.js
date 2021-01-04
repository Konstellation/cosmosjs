import CompactBitArray from "../utils/encode/CompactBitArray";

export default class Multisignature {
    /**
     *
     * @class
     * @constructor
     * @public
     * @param {Number} n
     * @return {{bitArray: CompactBitArray, sigs: Array<Buffer>}}
     */
    constructor(n) {
        /**
         * @type {CompactBitArray}
         * @public
         */
        this.bitArray = new CompactBitArray(n);
        /**
         * @type {Array<Buffer>}
         * @public
         */
        this.sigs = Array(0).fill(Buffer.from([]));
    }

    /**
     *
     * @param {Buffer} pubKey
     * @param {Array<Buffer>} keys
     * @returns {Number}
     */
    getIndex(pubKey, keys) {
        for (let i = 0; i < keys.length; i++) {
            if (pubKey.equals(Buffer.from(keys[i]))) {
                return i
            }
        }
        return -1
    }

    /**
     *
     * @param {Buffer} sig
     * @param {Number} index
     */
    addSignature(sig, index) {
        const newSigIndex = this.bitArray.numTrueBitsBefore(index);
        if (this.bitArray.getIndex(index)) {
            this.sigs[newSigIndex] = sig;
            return
        }
        this.bitArray.setIndex(index, true);
        // Optimization if the index is the greatest index
        if (newSigIndex === this.sigs.length) {
            this.sigs.push(sig);
            return
        }

        this.sigs.splice(newSigIndex, 0, sig);
    }

    /**
     *
     * @param {Buffer} sig
     * @param {Buffer} pubKey
     * @param {Array<Buffer>} keys
     */
    addSignatureFromPubKey(sig, pubKey, keys) {
        const index = this.getIndex(pubKey, keys);

        this.addSignature(sig, index);
    }
}
