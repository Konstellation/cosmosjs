import req from './req';
import {POST} from './methods';

export default function post (url, params, log) {
    return req(url, {
        method: POST,
        ...params,
    }, log);
}
