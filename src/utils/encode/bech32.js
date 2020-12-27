import { BECH32_PREFIX_ACC_PUB } from "../../constants"
import bech32 from "bech32";
import Sha256 from "sha256";
import { encodeBinary, marshalBinaryBare, PubKeySecp256k1 } from "./amino";


/**
 *
 * @param pub {Buffer}
 * @return string
 */
export const bech32ifyAccPub = (pub) => {
    return bech32.encode(BECH32_PREFIX_ACC_PUB,
        bech32.toWords(marshalBinaryBare(pub, PubKeySecp256k1)))
};
