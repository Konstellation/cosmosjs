function convertStringToBytes(str) {
    if (typeof str !== "string") {
        throw new Error("str expects a string")
    }
    var myBuffer = [];
    var buffer = Buffer.from(str, 'utf8');
    for (var i = 0; i < buffer.length; i++) {
        myBuffer.push(buffer[i]);
    }
    return myBuffer;
}

module.exports = convertStringToBytes;
