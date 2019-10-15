import req from './req';
import {GET} from './methods';

/**
 * Make get request
 *
 * @param {string} url
 * @param {object} params {{method|string, path|string, query|object, data|object}}
 * @param {boolean} log
 * @returns {Promise<*>}
 */
export default function get (url, params, log = false) {
    return req(url, {
        method: GET,
        ...params,
    }, log);
}
