import { BECH32_PREFIX_ACC_PUB } from "../../constants"
import bech32 from "bech32";
import {
    marshalBinaryBare,
    PubKeyMultisigTreshold,
    PubKeySecp256k1,
    unmarshalBinaryBare
} from "./amino";


/**
 *
 * @param pub {Object}
 * @return string
 */
export const bech32ifyAccPub = (pub) => {
    return bech32.encode(BECH32_PREFIX_ACC_PUB,
        bech32.toWords(marshalBinaryBare(pub, PubKeySecp256k1)))
};

export const bech32ifyAccPubMulti = (pub) => {
    return bech32.encode(BECH32_PREFIX_ACC_PUB,
        bech32.toWords(marshalBinaryBare(pub, PubKeyMultisigTreshold)), 250)
};

export const unbech32ify = (pub) => {
    console.log(pub);
    return unmarshalBinaryBare(bech32.fromWords(bech32.decode(pub).words));
};
