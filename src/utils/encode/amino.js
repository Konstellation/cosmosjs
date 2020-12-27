export const PubKeySecp256k1 = 'tendermint/PubKeySecp256k1';

/**
 * @param t {string} type
 * @constructor
 */
export const TypeInfos = (t) => {
    switch (t) {
        case PubKeySecp256k1:
            return {
                Prefix: [235, 90, 233, 135],
                Disamb: [248, 204, 234],
                Name: 'tendermint/PubkeySecp256k1',
                Registered: true,
            };
        default :
            return {
                Prefix: [0, 0, 0, 0],
                Disamb: [0, 0, 0],
                Name: ''
            }

    }
};

/**
 *
 * @param {Buffer} val
 */
export const encodeBinaryByteArray = (val) => {
    const len = val.length;
    return [len, ...val]
};


export const encodeBinary = (val) => {
    console.log(val.constructor.name);
    switch (val.constructor.name) {
        case 'Buffer':
            return encodeBinaryByteArray(val);
        default:
            return null;
    }
};

export const marshalBinaryBare = (val, t) => {
    const info = TypeInfos(t);

    const bz = encodeBinary(val);
    if (info.Registered) {
        return [...info.Prefix, ...bz];
    }
};
