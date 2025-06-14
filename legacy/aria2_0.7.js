class Aria2 {
    constructor (...args) {
        let path = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) {
            throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"');
        }
        this.scheme = path[1];
        this.url = path[2];
        this.secret = path[3];
        this.onmessage = this.onclose = null;
    }
    version = '0.7';
    jsonrpc = { retry: 10, timeout: 10000 };
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
        this.jsonrpc.scheme = scheme;
        this.jsonrpc.path = scheme + '://' + this.jsonrpc.url;
    }
    get scheme () {
        return this.jsonrpc.scheme;
    }
    set url (url) {
        if (this.jsonrpc.url === url) {
            return;
        }
        this.jsonrpc.url = url;
        this.jsonrpc.path = this.jsonrpc.scheme + '://' + url;
        this.jsonrpc.ws = this.jsonrpc.path.replace('http', 'ws');
        this.jsonrpc.tries = 0;
        this.connect();
    }
    get url () {
        return this.jsonrpc.url;
    }
    set secret (secret) {
        this.jsonrpc.secret = 'token:' + secret;
    }
    get secret () {
        return this.jsonrpc.secret;
    }
    set retries (number) {
        this.jsonrpc.retries = isNaN(number) || number <= 0 ? Infinity : number;
    }
    get retries () {
        return this.jsonrpc.retries;
    }
    set timeout (number) {
        this.jsonrpc.timeout = isNaN(number) ? 10000 : number <= 3 ? 3000 : number * 1000;
    }
    get timeout () {
        return this.jsonrpc.timeout / 1000;
    }
    set onmessage (callback) {
        this.jsonrpc.onmessage = typeof callback === 'function' ? callback : null;
    }
    get onmessage () {
        return this.jsonrpc.onmessage;
    }
    set onclose (callback) {
        this.jsonrpc.onclose = typeof callback === 'function' ? callback : null;
    }
    get onclose () {
        return this.jsonrpc.onclose;
    }
    connect () {
        this.disconnect();
        this.socket = new Promise((resolve, reject) => {
            let ws = new WebSocket(this.jsonrpc.ws);
            ws.onopen = (event) => resolve(ws);
            ws.onerror = reject;
            ws.onmessage = (event) => {
                let response = JSON.parse(event.data);
                if (!response.method) {
                    ws.resolve(response);
                } else if (typeof this.jsonrpc.onmessage === 'function') {
                    this.jsonrpc.onmessage(response);
                }
            };
            ws.onclose = (event) => {
                if (!event.wasClean && this.jsonrpc.tries < this.jsonrpc.retries) {
                    setTimeout(() => this.connect(), this.jsonrpc.timeout);
                }
                if (typeof this.jsonrpc.onclose === 'function') {
                    this.jsonrpc.onclose(event);
                }
                this.jsonrpc.tries++;
            };
        });
    }
    disconnect () {
        this.socket?.then( (ws) => ws.close() );
    }
    send (...args) {
        return new Promise(async (resolve, reject) => {
            let ws = await this.socket;
            ws.resolve = resolve;
            ws.onerror = reject;
            ws.send(this.json(args));
        });
    }
    post (...args) {
        return fetch(this.jsonrpc.path, { method: 'POST', body: this.json(args) }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        });
    }
    json (array) {
        let json = array.map(({ method, params = [] }) => {
            return { id: '', jsonrpc: '2.0', method, params: [this.jsonrpc.secret, ...params] };
        });
        return JSON.stringify(json);
    }
}
