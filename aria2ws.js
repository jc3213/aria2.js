class Aria2WebSocket {
    constructor (...args) {
        let path = args.join('#').match(/^(?:ws(s)?)?(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) { throw new Error('Malformed JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.ssl = path[1];
        this.url = path[2];
        this.secret = path[3];
    }
    version = '0.9';
    args = { retries: 10, timeout: 10000 };
    set ssl (ssl) {
        this.args.ssl = ssl ? 's' : '';
    }
    get ssl () {
        return !!this.args.ssl;
    }
    set url (url) {
        if (this.args.url === url) { return; }
        this.args.url = url;
        this.args.ws = 'ws' + this.args.ssl + '://' + url;
        this.disconnect();
        this.connect();
    }
    get url () {
        return this.args.url;
    }
    set secret (secret) {
        this.args.token = 'token:'　+ secret;
    }
    get secret () {
        return this.args.token.slice(6);
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
    connect () {
        let tries = 0;
        this.socket = new WebSocket(this.args.ws);
        this.socket.onopen = (event) => {
            this.alive = true;
            if (typeof this.args.onopen === 'function') { this.args.onopen(event); }
        };
        this.socket.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (!response.method) { this.args.onresponse(response); }
            else if (typeof this.args.onmessage === 'function') { this.args.onmessage(response); }
        };
        this.socket.onclose = (event) => {
            this.alive = false;
            if (!event.wasClean && tries ++ < this.args.retries) { setTimeout(() => this.connect(), this.args.timeout); }
            if (typeof this.args.onclose === 'function') { this.args.onclose(event); }
        };
    }
    disconnect () {
        this.socket?.close();
    }
    send (...args) {
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.args.token, ...params] }) );
        return new Promise((resolve, reject) => {
            this.args.onresponse = resolve;
            this.socket.onerror = reject;
            this.socket.send(JSON.stringify(json));
        });
    }
}
