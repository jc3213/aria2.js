class Aria2 {
    constructor (...args) {
        let path = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) { throw new Error('"' + args.join('", "') + '"'); }
        this.scheme = path[1];
        this.url = path[2];
        this.secret = path[3];
    }
    version = '0.10';
    #_ = { retries: 10, timeout: 10000 };
    set scheme (scheme) {
        let type = scheme.match(/^(http|ws)(s)?$/);
        if (!type) { throw new Error('"' + scheme + '"'); }
        this.#_.scheme = scheme;
        this.method = type[1];
        this.ssl = type[2];
    }
    get scheme () {
        return this.#_.scheme;
    }
    set method (method) {
        if (!/^(http|ws)$/.test(method)) { throw new Error('"' + method + '"'); }
        this.#_.method = method;
        this.call = this[method];
    }
    get method () {
        return this.#_.method;
    }
    set ssl (ssl) {
        this.#_.ssl = ssl ? 's' : '';
        this.path();
    }
    get ssl () {
        return !!this.#_.ssl;
    }
    set url (url) {
        this.#_.url = url;
        this.path();
    }
    get url () {
        return this.#_.url;
    }
    set secret (secret) {
        this.#_.token = 'token:'　+ secret;
    }
    get secret () {
        return this.#_.token.slice(6);
    }
    set retries (number) {
        this.#_.retries = isNaN(number) || number < 0 ? Infinity : number;
    }
    get retries () {
        return isNaN(this.#_.retries) ? Infinity : this.#_.retries;
    }
    set timeout (number) {
        this.#_.timeout = isNaN(number) ? 10000 : number * 1000;
    }
    get timeout () {
        return isNaN(this.#_.timeout) ? 10 : this.#_.timeout / 1000;
    }
    set onopen (func) {
        this.#_.onopen = typeof func === 'function' ? func : null;
    }
    get onopen () {
        return typeof this.#_.onopen === 'function' ? this.#_.onopen : null;
    }
    set onmessage (func) {
        this.#_.onmessage = typeof func === 'function' ? func : null;
    }
    get onmessage () {
        return typeof this.#_.onmessage === 'function' ? this.#_.onmessage : null;
    }
    set onclose (func) {
        this.#_.onclose = typeof func === 'function' ? func : null;
    }
    get onclose () {
        return typeof this.#_.onclose === 'function' ? this.#_.onclose : null;
    }
    path () {
        let {ssl, url} = this.#_;
        this.#_.xml = 'http' + ssl + '://' + url;
        this.#_.ws = 'ws' + ssl + '://' + url;
    }
    connect () {
        let tries = 0;
        this.socket = new WebSocket(this.#_.ws);
        this.socket.onopen = (event) => {
            this.alive = true;
            if (typeof this.#_.onopen === 'function') { this.#_.onopen(event); }
        };
        this.socket.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (!response.method) { this.#_.onresponse(response); }
            else if (typeof this.#_.onmessage === 'function') { this.#_.onmessage(response); }
        };
        this.socket.onclose = (event) => {
            this.alive = false;
            if (!event.wasClean && tries ++ < this.#_.retries) { setTimeout(() => this.connect(), this.#_.timeout); }
            if (typeof this.#_.onclose === 'function') { this.#_.onclose(event); }
        };
    }
    disconnect () {
        this.socket.close();
    }
    ws (...args) {
        return new Promise((resolve, reject) => {
            this.#_.onresponse = resolve;
            this.socket.onerror = reject;
            this.socket.send(this.json(args));
        });
    }
    http (...args) {
        return fetch(this.#_.xml, {method: 'POST', body: this.json(args)}).then((response) => {
            if (response.ok) { return response.json(); }
            throw new Error(response.statusText);
        });
    }
    json (args) {
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.#_.token, ...params] }) );
        return JSON.stringify(json);
    }
}
