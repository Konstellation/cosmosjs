const req = require('./req');

module.exports = async function post(url, params) {
    return await req(url, {
        method: 'POST',
        ...params
    })
};
