let jsonrpc = null;
let secret = 'token:';

let wsSock = null;
let wsReady = false;

let pending = {};
let ports = new Set();

function wsOpen() {
    for (let port of ports) {
        port.postMessage({ type: 'ws:open' });
    }

    wsReady = true;
    return { ok: true };
}

function wsMessage(event) {
    let json = JSON.parse(event.data);

    if ('method' in json) {
        for (let port of ports) {
            port.postMessage({ type: 'ws:message', details: json });
        }
    } else {
        let id = json.id;
        pending[id](json);
        delete pending[id];
    }
}

function wsClose() {
    for (let port of ports) {
        port.postMessage({ type: 'ws:close' });
    }

    wsReady = false;
}

function wsSend(json) {
    return new Promise((resolve, reject) => {
        if (!wsReady) {
            reject({ error: 'Failed to send message to JSON-RPC' });
            return;
        }

        let id = json.id;
        pending[id] = resolve;
        wsSock.send(JSON.stringify(json));
    });
}

function connect(config) {
    let token = config.secret;

    if (token) {
        secret = 'token:' + token;
    }

    let url = config.jsonrpc;

    if (url.startsWith('http://') || url.startsWith('https://')) {
        jsonrpc = 'ws' + url.substring(4);
    } else if (url.startsWith('ws://') || url.startsWith('wss://')) {
        jsonrpc = url;
    } else {
        return { error: 'Invalid "jsonrpc": expected http(s):// or ws(s)://' };
    }

    if (wsReady) {
        if (wsSock.url === jsonrpc) {
            return { ok: true };
        }

        wsSock.close();
    }

    return new Promise((resolve) => {
        wsSock = new WebSocket(jsonrpc);
        wsSock.onopen = () => resolve(wsOpen());
        wsSock.onmessage = wsMessage;
        wsSock.onerror = () => resolve({ error: 'Failed to open WebSocket connection' });
        wsSock.onclose = wsClose;
    });
}

function disconnect() {
    if (wsReady) {
        wsSock.close();
        return { ok: true };
    }

    return { error: 'WebSocket connection is not opened' };
}

function subscribe(port) {
    if (wsReady) {
        port.postMessage({ type: 'ws:open' });
    }

    ports.add(port);
    return { ok: true };
}

function unsubscribe(port) {
    let ok = ports.delete(port);
    return { ok };
}

async function call(id, arg) {
    let params = arg.params;

    if (params) {
        params = [secret].concat(params);
    } else {
        params = [secret];
    }

    return wsSend({ jsonrpc: '2.0', id, method: arg.method, params });
}

async function multicall(id, args) {
    let calls = [];

    for (let i = 0, l = args.length; i < l; i++) {
        let arg = args[i];
        let params = arg.params;

        if (params) {
            params = [secret].concat(params);
        } else {
            params = [secret];
        }

        calls[i] = { methodName: arg.methodName, params };
    }

    return wsSend({ jsonrpc: '2.0', id, method: 'system.multicall', params: [calls] });
}

self.addEventListener('connect', (event) => {
    let port = event.ports[0];

    port.start();

    port.onmessage = async (ev) => {
        let data = ev.data;
        let id = data.id;
        let type = data.type;
        let payload = data.payload;
        let result;

        if (type === 'connect') {
            result = await connect(payload);
        }

        if (type === 'disconnect') {
            result = disconnect();
        }

        if (type === 'subscribe') {
            result = subscribe(port);
        }

        if (type === 'unsubscribe') {
            result = unsubscribe(port);
        }

        if (type === 'call') {
            result = await call(id, payload);
        }

        if (type === 'multicall') {
            result = await multicall(id, payload);
        }

        port.postMessage({ id, type, result });
    };
});
