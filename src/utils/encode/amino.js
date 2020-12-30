import { encodeUint8 } from "@node-a-team/ts-amino/dist/encoder";

export const PubKeySecp256k1 = '23590233135';
export const PubKeyMultisigTreshold = '34193247226';

const Typ3_Varint = 0;
const Typ3_8Byte = 1;
const Typ3_ByteLength = 2;
const Typ3_Struct = 3;
const Typ3_StructTerm = 4;
const Typ3_4Byte = 5;

/**
 * @param t {string} type
 * @constructor
 */
export const TypeInfos = (t) => {
    switch (t) {
        case PubKeyMultisigTreshold:
            return {
                prefix: [34, 193, 247, 226],
                disamb: [180, 73, 174],
                name: 'tendermint/PubKeyMultisigTreshold',
                registered: true,
            };
        case PubKeySecp256k1:
            return {
                prefix: [235, 90, 233, 135],
                disamb: [248, 204, 234],
                name: 'tendermint/PubkeySecp256k1',
                registered: true,
            };
        default :
            return {
                prefix: [0, 0, 0, 0],
                disamb: [0, 0, 0],
                name: '',
                registered: false
            }

    }
};

export const FieldInfos = (t) => {
    switch (t) {
        case PubKeyMultisigTreshold:
            return {
                treshold: {
                    index: 0,
                    binFieldNum: 1,
                    ftype: 'Number',
                },
                public_keys: {
                    index: 1,
                    binFieldNum: 2,
                    ftype: 'Array',
                    prefix: PubKeySecp256k1,
                    unpackedList: true,
                },
                registered: true,
            };
        default :
            return {}

    }
};

export const typeToTyp3 = (v) => {
    switch (v.constructor.name) {
        case 'Number': {
            return Typ3_Varint;
        }
        case 'Array': {
            return Typ3_ByteLength;
        }
    }
// case reflect.Interface:
//     return Typ3_ByteLength
// case reflect.Array, reflect.Slice:
//     return Typ3_ByteLength
// case reflect.String:
//     return Typ3_ByteLength
// case reflect.Struct, reflect.Map:
//     return Typ3_ByteLength
// case reflect.Int64, reflect.Uint64:
//     if opts.BinFixed64 {
//         return Typ3_8Byte
//     } else {
//         return Typ3_Varint
//     }
// case reflect.Int32, reflect.Uint32:
//     if opts.BinFixed32 {
//         return Typ3_4Byte
//     } else {
//         return Typ3_Varint
//     }
// case reflect.Int16, reflect.Int8, reflect.Int,
//         reflect.Uint16, reflect.Uint8, reflect.Uint, reflect.Bool:
//     return Typ3_Varint
// case reflect.Float64:
//     return Typ3_8Byte
// case reflect.Float32:
//     return Typ3_4Byte
};


// PutUvarint encodes a uint64 into buf and returns the number of bytes written.
// If the buffer is too small, PutUvarint will panic.
export const PutUvarint = (buf, x) => {
    let i = 0;
    while (x >= 0x80) {
        buf[i] = encodeUint8(x) | 0x80;
        x >>= 7;
        i++
    }

    buf[i] = encodeUint8(x);
    return i + 1
};

export const encodeFieldNumberAndTyp3 = (num, typ) => {
    if ((typ & 0xF8) !== 0) {
        throw new Error(`invalid Typ3 byte ${typ}`);
    }
    if (num < 0 || num > (1 << 29 - 1)) {
        throw new Error(`invalid field number ${num}`);
    }

    // Pack Typ3 and field number.
    const value64 = (num << 3) | typ;
    return [value64];

    const buf = Array(10);
    const n = PutUvarint(buf, value64);
    return buf.slice(0, n);
};

/**
 *
 * @param {Buffer} val
 */
export const encodeBinaryByteArray = (val) => {
    const len = val.length;
    return [len, ...val]
};

export const encodeBinaryNumber = (val) => {
    // const len = val.length;
    return [val]
};

export const encodeBinaryList = (val, finfo) => {
    const buf = [];
    for (const e of val) {
        const typ3 = typeToTyp3(e.payload, finfo);
        buf.push(...encodeFieldNumberAndTyp3(finfo.binFieldNum, typ3));

        const bz = marshalBinaryBare(e.payload, finfo.prefix);
        buf.push(bz.length);
        buf.push(...bz);
    }

    return buf;
};

export const encodeBinaryObject = (val, finfos) => {
    let buf = [];
    for (const k in val) {
        const finfo = finfos[k];
        if (finfo.unpackedList) {
            buf.push(...encodeBinaryList(val[k], finfo));
        } else {
            const typ3 = typeToTyp3(val[k], finfo);
            buf.push(...encodeFieldNumberAndTyp3(finfo.binFieldNum, typ3));
            buf.push(...encodeBinary(val[k]));
        }
    }

    return buf;
};

export const encodeBinary = (val, prefix) => {
    switch (val.constructor.name) {
        case 'Buffer':
            return encodeBinaryByteArray(val);
        case 'Array':
            return encodeBinaryByteArray(val);
        case 'Number':
            return encodeBinaryNumber(val);
        case 'Object':
            const finfos = FieldInfos(prefix);
            return encodeBinaryObject(val, finfos);
        default:
            return null;
    }
};

export const marshalBinaryBare = (val, t) => {
    const info = TypeInfos(t);

    const bz = encodeBinary(val, t);
    if (info.registered) {
        return [...info.prefix, ...bz];
    }
};

export const unmarshalBinaryBare = (val, t) => {
    let buf = [];
    let prefix = [];
    let len = 0;
    let payload = [];

    for (let i = 0, j = 0; i < val.length; i++, j++) {
        buf.push(val[i]);

        if (i === 3) {
            t = TypeInfos(buf.join(''));
            if (!t.registered) {
                buf = [];
            } else {
                prefix = buf;
                buf = []
            }
        }

        if (i === prefix.length) {
            len = buf[0];
            if (len === val.length - prefix.length - 1) {
                payload = val.splice(i + 1, len);
                break;
            }
        }
    }

    return { t, payload };
};
