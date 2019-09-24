const req = require('./req');

module.exports = async function get(url, params) {
    return await req(url, {
        method: "GET",
        ...params
    })
};
