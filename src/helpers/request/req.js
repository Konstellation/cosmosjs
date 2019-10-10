import {GET, POST} from './methods';

export default function req (url, {method, path, query, data} = {}, log = false) {
    url = new URL(`${url}${path || ''}`);
    query && Object.keys(query).forEach((param) => {
        if (query[param]) url.searchParams.append(param, query[param]);
    });

    log && console.log(url.toString());

    let reqObj = {};
    if (!method) method = GET;
    if (method === POST) {
        reqObj = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
    }

    return fetch(url.toString(), reqObj).then(response => response.json());
}
