let aria2c = {
    jsonrpc: 'http://localhost:6800/jsonrpc',
    secret: '',
    params: [],
    version: 0.1
};

self.addEventListener('message', (event) => {
    let {method, params} = event.data;
    switch (method) {
        case 'aria2.WebWorker':
            jsonrpc(params);
            break;
        default:
            aria2c(method, params);
            break;
    }
});

async function aria2c(method, params) {
    let json = { id: '', jsonrpc: '2.0', method, params: [...aria2c.params, ...params] };
    let response = await fetch(aria2c.jsonrpc, { method: 'POST', body: JSON.stringify(json) });
    let result = await response.json();
    self.postMessage({method, result});
}

function jsonrpc(method, {jsonrpc, secret}) {
    if (jsonrpc) {
        aria2c.jsonrpc = jsonrpc;
    }
    if (secret) {
        aria2c.secret = secret;
        aria2c.params = ['token:' + secret];
    }
    self.postMessage({ aria2c });
}
