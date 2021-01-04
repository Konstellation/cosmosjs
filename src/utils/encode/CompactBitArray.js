export default class CompactBitArray {
    /**
     * @class
     * @constructor
     * @public
     */
    constructor(bits) {
        /**
         * @type {number}
         * @public
         */
        this.extraBitsStored = bits % 8;
        /**
         * @type {Array}
         * @public
         */
        this.elems = Array(Math.floor((bits + 7) / 8));
    }

    /**
     * Size returns the number of bits in the bitarray
     *
     * @return number
     */
    size() {
        if (this.extraBitsStored === 0) {
            return this.elems * 8
        }
        // num_bits = 8*num_full_bytes + overflow_in_last_byte
        // num_full_bytes = (len(bA.Elems)-1)
        return (this.elems.length - 1) * 8 + Math.floor(this.extraBitsStored)
    }

    /**
     *
     * GetIndex returns the bit at index i within the bit array.
     The behavior is undefined if i >= bA.Size()
     * @param {number} i
     * @returns boolean
     */
    getIndex(i) {
        if (i >= this.size()) {
            return false
        }

        return (this.elems[i >> 3] & (1 << (7 - (i % 8)))) > 0
    }

    /**
     *
     * SetIndex sets the bit at index i within the bit array.
     The behavior is undefined if i >= bA.Size()

     * @param {number} i
     * @param {boolean} v
     * @return boolean
     */
    setIndex(i, v) {
        if (i >= this.size()) {
            return false
        }
        if (v) {
            this.elems[i >> 3] |= (1 << (7 - (i % 8)))
        } else {
            this.elems[i >> 3] &= ~(1 << (7 - (i % 8)))
        }
        return true
    }

    /**
     * NumTrueBitsBefore returns the number of bits set to true before the
     given index. e.g. if bA = _XX__XX, NumOfTrueBitsBefore(4) = 2, since
     there are two bits set to true before index 4.

     * @param {number} index
     * @return {number}
     */
    numTrueBitsBefore(index) {
        let numTrueValues = 0;
        for (let i = 0; i < index; i++) {
            if (this.getIndex(i)) {
                numTrueValues++
            }
        }

        return numTrueValues
    }
}
