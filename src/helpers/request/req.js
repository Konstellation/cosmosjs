const fetch = require("node-fetch");

module.exports = async function req(url, {method, path, query, data} = {}) {
    url = new URL(`${url}${path ? '/' + path : ''}`);
    query && Object.keys(query).forEach(param => {
        url.searchParams.append(param, query[param])
    });
    let reqObj = {};
    if (!method) method = 'GET';
    if (method === 'POST')
        reqObj = {
            method, headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    return await fetch(url.toString(), reqObj).then(response => response.json())
};
