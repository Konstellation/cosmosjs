import req from './req';
import {GET} from './methods';

/**
 * Make get request
 *
 * @param {string} url
 * @param {object} params
 * @param {boolean} log
 * @returns {Promise<*>}
 */
export default function get (url, params, log) {
    return req(url, {
        method: GET,
        ...params,
    }, log);
}
