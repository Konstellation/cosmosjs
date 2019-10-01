import req from './req';
import {GET} from './methods';

export default function get (url, params, log) {
    return req(url, {
        method: GET,
        ...params,
    }, log);
}
