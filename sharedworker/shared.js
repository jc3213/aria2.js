let jsonrpc = null;
let secret = 'token:';
let socket = null;
let pending = {};
let ports = new Set();

function broadcast(json) {
    return new Promise((resolve, reject) => {
        let id = json.id;
        pending[id] = resolve;
        socket.onerror = reject;
        socket.send(JSON.stringify(json));
    });
}

async function call(port, id, type, arg) {
    let params = arg.params;

    if (params) {
        params = [secret].concat(params);
    } else {
        params = [secret];
    }

    let response = await broadcast({ jsonrpc: '2.0', id, method: arg.method, params });
    port.postMessage({ id, type, response });
}

async function multicall(port, id, type, args) {
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

    let response = await broadcast({ jsonrpc: '2.0', id, method: 'system.multicall', params: [calls] });
    port.postMessage({ id, type, response });
}

function connect(port, id, type, config) {
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
        port.postMessage({id, type, response: { error: new Error('Invalid "jsonrpc": expected http(s):// or ws(s)://') } });
        return;
    }

    if (socket) {
        if (socket.readyState === 1 && socket.url === jsonrpc ) {
            port.postMessage({ id, type, response: { ok: true } });
            return;
        }

        socket.close();
    }

    socket = new WebSocket(jsonrpc);

    socket.onopen = () => {
        port.postMessage({ id, type, response: { ok: true } });
    };

    socket.onmessage = (event) => {
        let message = JSON.parse(event.data);

        if (message.method) {
            for (let port of ports) {
                port.postMessage({ type: 'websocket', response: message });
            }
        } else {
            let id = message.id;
            pending[id](message);
            delete pending[id];
        }
    };

    socket.onerror = (event) => {
        port.postMessage({ id, type, response: { error: new Error('Failed to open WebSocket connection') } });
    };
}

function disconnect(port, id, type) {
    if (socket && socket.readyState === 1) {
        socket.close();
        port.postMessage({ id, type, response: { ok: true } });
    } else {
        port.postMessage({ id, type, response: { error: new Error('WebSocket connection is not opened') } });
    }
}

function subscribe(port) {
    ports.add(port);
}

function unsubscribe(port) {
    let ok = ports.delete(port);
}

self.addEventListener('connect', (event) => {
    let port = event.ports[0];

    port.start();

    port.onmessage = (ev) => {
        let data = ev.data;
        let type = data.type;
        self[type](port, data.id, type, data.payload);
    };
});
