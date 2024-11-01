class Aria2 {
    constructor (...args) {
        let path = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.scheme = path[1];
        this.url = path[2];
        this.secret = path[3];
    }
    version = '0.8.0';
    jsonrpc = { retries: 10, timeout: 10000 };
    events = { onopen: null, onmessage: null, onclose: null };
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
        this.jsonrpc.count = 0;
        this.disconnect();
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
    set retries (number) {
        this.jsonrpc.retries = isNaN(number) || number < 0 ? Infinity : number;
    }
    get retries () {
        return isNaN(this.jsonrpc.retries) ? Infinity : this.jsonrpc.retries;
    }
    set timeout (number) {
        this.jsonrpc.time = isNaN(number) ? 10 : number | 0;
        this.jsonrpc.timeout = this.jsonrpc.time * 1000;
    }
    get timeout () {
        return isNaN(this.jsonrpc.time) ? 10 : this.jsonrpc.time | 0;
    }
    connect () {
        this.socket = new Promise((resolve, reject) => {
            let ws = new WebSocket(this.jsonrpc.ws);
            ws.onopen = (event) => {
                this.alive = true;
                if (typeof this.events.onopen === 'function') { this.events.onopen(event); }
                resolve(ws);
            };
            ws.onmessage = (event) => {
                let response = JSON.parse(event.data);
                if (!response.method) { ws.resolve(response); }
                else if (typeof this.events.onmessage === 'function') { this.events.onmessage(response); }
            };
            ws.onclose = (event) => {
                this.alive = false;
                if (!event.wasClean && this.jsonrpc.count < this.jsonrpc.retries) { setTimeout(() => this.connect(), this.jsonrpc.timeout); }
                if (typeof this.events.onclose === 'function') { this.events.onclose(event); }
                this.jsonrpc.count ++;
            };
        });
    }
    disconnect () {
        this.socket?.then( (ws) => ws.close() );
    }
    set onopen (callback) {
        this.events.onopen = typeof callback === 'function' ? callback : null;
    }
    get onopen () {
        return typeof this.events.onopen === 'function' ? this.events.onopen : null;
    }
    set onmessage (callback) {
        this.events.onmessage = typeof callback === 'function' ? callback : null;
    }
    get onmessage () {
        return typeof this.events.onmessage === 'function' ? this.events.onmessage : null;
    }
    set onclose (callback) {
        this.events.onclose = typeof callback === 'function' ? callback : null;
    }
    get onclose () {
        return typeof this.events.onclose === 'function' ? this.events.onclose : null;
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
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [...this.jsonrpc.params, ...params] }) );
        return JSON.stringify(json);
    }
}
