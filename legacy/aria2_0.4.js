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
    version = '0.4';
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
        this._onmessage = null;
        if (!this.websocket) {
            this.connect();
        } else {
            this.disconnect().then((event) => {
                this.connect()
            });
        }
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
    connect () {
        this.websocket = new Promise((resolve, reject) => {
            const websocket = new WebSocket(this._jsonrpc.replace('http', 'ws'));
            websocket.onopen = (event) => resolve(websocket);
            websocket.onerror = reject;
        });
    }
    disconnect () {
        return new Promise(async (resolve, reject) => {
            let websocket = await this.websocket;
            websocket.onclose = (event) => resolve(event);
            websocket.onerror = reject;
            websocket.close();
        });
    }
    send (...messages) {
        return new Promise(async (resolve, reject) => {
            let websocket = await this.websocket;
            websocket.onmessage = (event) => resolve(JSON.parse(event.data));
            websocket.onerror = reject;
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
