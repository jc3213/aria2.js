class Aria2 {
    constructor (...args) {
        const jsonrpc = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!jsonrpc) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.scheme = jsonrpc[1];
        this.url = jsonrpc[2];
        this.secret = jsonrpc[3];
    }
    version = '0.4';
    set scheme (scheme) {
        if (!/^(https?|wss?)$/.test(scheme)) { throw new Error('Invalid JSON-RPC scheme: "' + scheme + '" is not supported!'); }
        this._scheme = scheme;
        this._jsonrpc = scheme.replace('ws', 'http') + '://' + this._url;
        this._socket = this._jsonrpc.replace('http', 'ws');
    }
    get scheme () {
        return this._scheme;
    }
    set url (url) {
        if (this._url === url) { return; }
        this._url = url;
        this._jsonrpc = this._scheme.replace('ws', 'http') + '://' + url;
        this._socket = this._jsonrpc.replace('http', 'ws');
        this._onmessage = null;
        if (!this.websocket) { return this.connect(); }
        this.disconnect().then( (event) => this.connect() );
    }
    get url () {
        return this._url;
    }
    set secret (secret) {
        this._secret = 'token:' + secret;
    }
    get secret () {
        return this._secret;
    }
    set onmessage (callback) {
        if (typeof callback !== 'function') { return; }
        if (!this._onmessage) {
            this.websocket.then( (websocket) => {
                websocket.addEventListener('message', (event) => this._onmessage(JSON.parse(event.data)));
            });
        }
        this._onmessage = callback;
    }
    get onmessage () {
        return this._onmessage;
    }
    connect () {
        this.websocket = new Promise((resolve, reject) => {
            const websocket = new WebSocket(this._socket);
            websocket.onopen = (event) => resolve(websocket);
            websocket.onerror = (error) => reject(error);
        });
    }
    disconnect () {
        return this.websocket.then((websocket) => new Promise((resolve, reject) => {
            websocket.onclose = (event) => resolve(event);
            websocket.onerror = (error) => reject(error);
            websocket.close();
        }));
    }
    call (...message) {
        let json = message.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this._secret, ...params] }) );
        return fetch(this._jsonrpc, { method: 'POST', body: JSON.stringify(json) }).then((response) => {
            if (response.ok) { return response.json(); }
            throw new Error(response.statusText);
        });
    }
}
