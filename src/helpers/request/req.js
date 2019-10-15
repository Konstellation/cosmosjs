import {GET, POST} from './methods';
import {HEADER_CONTENT_TYPE, CONTENT_TYPE_APPLICATION_JSON} from './constants';

/**
 * Make raw request
 * @param {string} url
 * @param {string} method
 * @param {string} path
 * @param {object} query
 * @param {object} data
 * @param {boolean} log
 * @returns {Promise<any>}
 */
export default function req (url, {method = GET, path = '', query, data} = {}, log = false) {
    const urlPath = new URL(`${url}${path}`);
    query && Object.keys(query).forEach((param) => {
        if (query[param]) urlPath.searchParams.append(param, query[param]);
    });

    log && console.log(urlPath.toString());

    return fetch(
        urlPath.toString(),
        method === POST ? {
            method,
            headers: {
                HEADER_CONTENT_TYPE: CONTENT_TYPE_APPLICATION_JSON,
            },
            body: JSON.stringify(data),
        } : {}
    ).then(response => response.json());
}
