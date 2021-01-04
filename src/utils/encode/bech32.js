import { BECH32_PREFIX_ACC_ADDR, BECH32_PREFIX_ACC_PUB } from "../../constants"
import bech32 from "bech32";
import {
    unmarshalBinaryBare
} from "./amino";


/**
 *
 * @param pub {Object}
 * @param LIMIT {Number}
 * @return string
 */
export const bech32ifyAccPub = (pub, LIMIT = 90) => {
    return bech32.encode(BECH32_PREFIX_ACC_PUB, bech32.toWords(pub), LIMIT)
};

/**
 *
 * @param addr {Object}
 * @param LIMIT {Number}
 * @return string
 */
export const bech32ifyAccAddr = (addr, LIMIT = 90) => {
    return bech32.encode(BECH32_PREFIX_ACC_ADDR, bech32.toWords(addr), LIMIT)
};

export const unbech32ify = (pub) => {
    return unmarshalBinaryBare(bech32.fromWords(bech32.decode(pub).words));
};
