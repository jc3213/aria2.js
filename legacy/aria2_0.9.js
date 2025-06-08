class Aria2 {
    constructor (...args) {
        let path = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) { throw new Error('Malformed JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.scheme = path[1];
        this.url = path[2];
        this.secret = path[3];
    }
    version = '0.9';
    args = { retries: 10, timeout: 10000 };
    set scheme (scheme) {
        let method = scheme.match(/^(http|ws)(s)?$/);
        if (!method) { throw new Error('Unsupported scheme: "' + scheme + '"'); }
        this.args.scheme = scheme;
        this.args.ssl = method[2] ?? '';
        this.call = this[method[1]];
        this.path();
    }
    get scheme () {
        return this.args.scheme;
    }
    set url (url) {
        this.args.url = url;
        this.path();
    }
    get url () {
        return this.args.url;
    }
    set secret (secret) {
        this.args.secret = 'token:'　+ secret;
    }
    get secret () {
        return this.args.secret.slice(6);
    }
    set retries (number) {
        this.args.retries = isNaN(number) || number < 0 ? Infinity : number;
    }
    get retries () {
        return isNaN(this.args.retries) ? Infinity : this.args.retries;
    }
    set timeout (number) {
        this.args.timeout = isNaN(number) ? 10000 : number * 1000;
    }
    get timeout () {
        return isNaN(this.args.timeout) ? 10 : this.args.timeout / 1000;
    }
    set onopen (callback) {
        this.args.onopen = typeof callback === 'function' ? callback : null;
    }
    get onopen () {
        return typeof this.args.onopen === 'function' ? this.args.onopen : null;
    }
    set onmessage (callback) {
        this.args.onmessage = typeof callback === 'function' ? callback : null;
    }
    get onmessage () {
        return typeof this.args.onmessage === 'function' ? this.args.onmessage : null;
    }
    set onclose (callback) {
        this.args.onclose = typeof callback === 'function' ? callback : null;
    }
    get onclose () {
        return typeof this.args.onclose === 'function' ? this.args.onclose : null;
    }
    path () {
        let {ssl, url} = this.args;
        this.args.xml = 'http' + ssl + '://' + url;
        this.args.ws = 'ws' + ssl + '://' + url;
        this.args.tries = 0;
    }
    connect () {
        this.socket = new WebSocket(this.args.ws);
        this.socket.onopen = (event) => {
            if (typeof this.args.onopen === 'function') { this.args.onopen(event); }
        };
        this.socket.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (response.method) {
                if (typeof this.args.onmessage === 'function') { this.args.onmessage(response); }
            }
            else {
                let [{ id }] = response;
                this[id](response);
                delete this[id];
            }
        };
        this.socket.onclose = (event) => {
            if (!event.wasClean && this.args.tries ++ < this.args.retries) {
                setTimeout(() => this.connect(), this.args.timeout);
            }
            if (typeof this.args.onclose === 'function') { this.args.onclose(event); }
        };
    }
    disconnect () {
        this.socket.close();
    }
    ws (...args) {
        return new Promise((resolve, reject) => {
            let body = this.json(args)
            let [{ id }] = body;
            this[id] = resolve;
            this.socket.onerror = reject;
            this.socket.send(JSON.stringify(body));
        });
    }
    http (...args) {
        return fetch(this.args.xml, { method: 'POST', body: JSON.stringify(this.json(args)) }).then((response) => {
            if (response.ok) { return response.json(); }
            throw new Error(response.statusText);
        });
    }
    json (args) {
        let id = String(Date.now());
        return args.map( ({ method, params = [] }) => ({ id, jsonrpc: '2.0', method, params: [this.args.secret, ...params] }) );
    }
}
