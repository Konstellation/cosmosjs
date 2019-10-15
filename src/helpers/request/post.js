import req from './req';
import {POST} from './methods';

/**
 * Make post request
 *
 * @param {string} url
 * @param params {{method|string, path|string, query|object, data|object}}
 * @param {boolean} log
 * @returns {Promise<*>}
 */
export default function post (url, params, log = false) {
    return req(url, {
        method: POST,
        ...params,
    }, log);
}
