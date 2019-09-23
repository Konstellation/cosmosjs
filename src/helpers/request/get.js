const fetch = require("node-fetch");

module.exports = async function get(url) {
    return await fetch(url).then(response => response.json())
};