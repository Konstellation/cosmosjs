/**
 * Sorts object values by keys
 *
 * @param obj
 * @returns {*|Uint8Array|BigInt64Array|any[]|Float64Array|Int8Array|Float32Array|Int32Array|Uint32Array|Uint8ClampedArray|BigUint64Array|Int16Array|Uint16Array|null}
 */
function sortObject (obj) {
    if (Array.isArray(obj))
        return obj.map(sortObject);
    if (typeof obj === 'object')
        return Object.keys(obj).sort().reduce((a, b) => {
            a[b] = sortObject(obj[b]);
            return a;
        }, {});
    return obj;
}

export default sortObject;
