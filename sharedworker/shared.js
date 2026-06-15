let jsonrpc = null;
let socket = null;
let secret = '';
let broadcast = null;
let pending = {};
let ports = new Set();

function post(json) {
    return fetch(jsonrpc, { method: 'POST', body: JSON.stringify(json) }).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network error: ' + response.status + ' ' + response.statusText);
    });
}

function send(json) {
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
    let pwd = config.secret;
    if (pwd) {
        secret = 'token:' + pwd;
    }
    let url = config.jsonrpc;
    let wsa;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        jsonrpc = url;
        wsa = 'ws' + url.substring(4);
    } else if (url.startsWith('ws://') || url.startsWith('wss://')) {
        jsonrpc = 'http' + url.substring(2);
        wsa = url;
    } else {
        port.postMessage({id, type, response: { error: 'Invalid JSON-RPC Endpoint: expected http(s):// or ws(s)://' } });
        return;
    }
    ports.add(port);
    if (socket && socket.url === wsa && socket.readyState === 1) {
        port.postMessage({ id, type, response: { ok: true } });
        return;
    }
    socket = new WebSocket(wsa);
    socket.onopen = () => {
        broadcast = send;
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
    socket.onclose = (event) => {
        broadcast = post;
        port.postMessage({ id, type, response: { error: 'Failed to open WebSocket connection' } });
    };
}

function disconnect(port, id, type) {
    ports.delete(port);
    if (ports.size > 0) {
        port.postMessage({ id, type, response: { ok: true } });
        return;
    }
    socket.onclose = (event) => {
        socket = null;
        broadcast = post;
        port.postMessage({ id, type, response: { ok: true } });
    };
    socket.close();
}

self.addEventListener('connect', (event) => {
    let port = event.ports[0];
    port.start();
    port.onmessage = (ev) => {
        let data = ev.data;
        let type = data.type;
        self[type](port, data.id, type, data.payload);
    };
    port.onclose = () => {
        port = null;
    };
});
