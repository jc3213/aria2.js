class Aria2 {
    constructor (...args) {
        let path = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.jsonrpc = {};
        this.scheme = path[1];
        this.url = path[2];
        this.secret = path[3];
        this.onmessage = this.onclose = null;
    }
    set scheme (scheme) {
        this.call = { 'http': this.post, 'https': this.post, 'ws': this.send, 'wss': this.send }[ scheme ];
        if (!this.call) { throw new Error('Invalid JSON-RPC scheme: "' + scheme + '" is not supported!'); }
        this.jsonrpc.scheme = scheme;
        this.jsonrpc.path = scheme + '://' + this.jsonrpc.url;
    }
    get scheme () {
        return this.jsonrpc.scheme;
    }
    set url (url) {
        if (this.jsonrpc.url === url) { return; }
        this.jsonrpc.url = url;
        this.jsonrpc.path = this.jsonrpc.scheme + '://' + url;
        this.jsonrpc.ws = this.jsonrpc.path.replace('http', 'ws');
        this.connect();
    }
    get url () {
        return this.jsonrpc.url;
    }
    set secret (secret) {
        this.jsonrpc.secret = secret;
        this.jsonrpc.params = secret ? ['token:' + secret] : [];
    }
    get secret () {
        return this.jsonrpc.secret;
    }
    connect () {
        this.socket?.then( (ws) => ws.close() );
        this.socket = new Promise((resolve, reject) => {
            let ws = new WebSocket(this.jsonrpc.ws);
            ws.onopen = (event) => resolve(ws);
            ws.onmessage = (event) => {
                let response = JSON.parse(event.data);
                response.method ? this.jsonrpc.onmessage(response) : ws.resolve(response);
            };
            ws.onclose = (event) => {
                if (!event.wasClean) { setTimeout(() => this.connect(), 5000); }
                this.jsonrpc.onclose(event);
            };
        });
    }
    set onmessage (callback) {
        this.jsonrpc.onmessage = typeof callback === 'function' ? callback : () => null;
    }
    get onmessage () {
        return this.jsonrpc.onmessage;
    }
    set onclose (callback) {
        this.jsonrpc.onclose = typeof callback === 'function' ? callback : () => null;
    }
    get onclose () {
        return this.jsonrpc.onclose;
    }
    send (...args) {
        return this.socket.then((ws) => new Promise((resolve, reject) => {
            ws.resolve = resolve;
            ws.onerror = reject;
            ws.send(this.json(args));
        }));
    }
    post (...args) {
        return fetch(this.jsonrpc.path, {method: 'POST', body: this.json(args)}).then((response) => {
            if (response.ok) { return response.json(); }
            throw new Error(response.statusText);
        });
    }
    json (args) {
        let json = args.map( ({method, params = []}) => ({ id: '', jsonrpc: '2.0', method, params: [...this.jsonrpc.params, ...params] }) );
        return JSON.stringify(json);
    }
}
