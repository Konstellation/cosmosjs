import req from './req';

export default function get (url, params, log) {
    return req(url, {
        method: 'GET',
        ...params,
    }, log);
}
