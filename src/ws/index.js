export default class Socket {
    constructor (nodeUrl) {
        const {host} = new URL(nodeUrl);

        this.events = {};

        this.socket = new WebSocket(`ws://${host}/websocket`);
    }


    subscribe (query, handler) {
        if (!query) {
            throw new Error('query was not set or invalid');
        }
        if (!handler) {
            throw new Error('handler was not set or invalid');
        }

        this.events[query] = handler;
    }

    connect () {
        this.socket.onopen = () => {
            console.log('[open] Connection established');

            const method = 'subscribe';
            for (const query in this.events) {
                console.log(`[${method}] query: ${query}`);
                this.socket.send(this.toJsonRPC(method, query));
            }
        };

        this.socket.onmessage = ({data}) => {
            const {id, result: {query, ...rest}} = JSON.parse(data);
            console.log(`[message] Data received from server: ${id}`);
            if (query) {
                this.events[query](rest);
            }
        };

        this.socket.onclose = ({wasClean, code, reason}) => {
            this.socket.send(this.toJsonRPC('unsubscribe_all'));
            if (wasClean) {
                console.log(`[close] Connection closed cleanly, code=${code} reason=${reason}`);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('[close] Connection died');
            }
        };

        this.socket.onerror = ({message}) => {
            console.log(`[error] ${message}`);
        };
    }

    toJsonRPC (method, query) {
        const params = query ? {query} : {};

        return JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: Math.random(),
        });
    }
}
