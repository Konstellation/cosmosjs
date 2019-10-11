import req from './req';
import {POST} from './methods';

/**
 * Make post request
 *
 * @param {string} url
 * @param {object} params
 * @param {boolean} log
 * @returns {Promise<*>}
 */
export default function post (url, params, log) {
    return req(url, {
        method: POST,
        ...params,
    }, log);
}
