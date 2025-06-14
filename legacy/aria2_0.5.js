class Aria2 {
    constructor (...args) {
        const jsonrpc = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!jsonrpc) {
            throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"');
        }
        this.scheme = jsonrpc[1];
        this.url = jsonrpc[2];
        this.secret = jsonrpc[3];
    }
    version = '0.5';
    set scheme (scheme) {
        this.call = {
            'http': this.post,
            'https': this.post,
            'ws': this.send,
            'wss': this.send
        }[ scheme ];
        if (!this.call) {
            throw new Error('Invalid JSON-RPC scheme: "' + scheme + '" is not supported!');
        }
        this._scheme = scheme;
        this._jsonrpc = scheme + '://' + this._url;
    }
    get scheme () {
        return this._scheme;
    }
    set url (url) {
        if (this._url === url) {
            return;
        }
        this._url = url;
        this._jsonrpc = this._scheme + '://' + url;
        this.connect();
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
        if (typeof callback !== 'function') {
            return;
        }
        if (!this._onmessage) {
            this.websocket.then((websocket) => {
                websocket.addEventListener('message', (event) => {
                    this._onmessage(JSON.parse(event.data));
                });
            });
        }
        this._onmessage = callback;
    }
    get onmessage () {
        return this._onmessage;
    }
    set onclose (callback) {
        if (typeof callback !== 'function') {
            return;
        }
        if (!this._onclose) {
            this.websocket.then((websocket) => {
                websocket.addEventListener('close', this._onclose);
            });
        }
        this._onclose = callback;
    }
    get onclose () {
        return this._onclose;
    }
    connect () {
        this.disconnect();
        this.websocket = new Promise((resolve, reject) => {
            const websocket = new WebSocket(this._jsonrpc.replace('http', 'ws'));
            websocket.onopen = (event) => resolve(websocket);
            websocket.onerror = reject;
            if (typeof this._onmessage === 'function') {
                websocket.addEventListener('message', (event) => {
                    this._onmessage(JSON.parse(event.data));
                });
            }
            if (typeof this._onclose === 'function') {
                websocket.addEventListener('close', this._onclose);
            }
        });
    }
    disconnect () {
        this.websocket?.then( (websocket) => websocket.close() );
    }
    send (...messages) {
        return new Promise(async (resolve, reject) => {
            let websocket = await this.websocket;
            websocket.onmessage = (event) => resolve(JSON.parse(event.data));
            websocket.onerror = (error) => reject(error);
            websocket.send(this.json(messages));
        });
    }
    post (...messages) {
        return fetch(this._jsonrpc, { method: 'POST', body: this.json(messages) }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        });
    }
    json (array) {
        const json = array.map(({ method, params = [] }) => {
            return { id: '', jsonrpc: '2.0', method, params: [this._secret, ...params] };
        });
        return JSON.stringify(json);
    }
}
