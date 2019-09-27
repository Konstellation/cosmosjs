import req from './req';

export default function post (url, params, log) {
    return req(url, {
        method: 'POST',
        ...params,
    }, log);
}
