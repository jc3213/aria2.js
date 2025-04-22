class Aria2WebSocket {
    constructor (...args) {
        let path = args.join('#').match(/^(?:ws(s)?)?(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) { throw new Error('Unsupported parameters: "' + args.join('", "') + '"'); }
        this.ssl = path[1];
        this.url = path[2];
        this.secret = path[3];
    }
    version = '1.0';
    #args = { retries: 10, timeout: 10000 };
    set ssl (ssl) {
        this.#args.ssl = ssl ? 's' : '';
    }
    get ssl () {
        return !!this.#args.ssl;
    }
    set url (url) {
        this.#args.url = url;
    }
    get url () {
        return this.#args.url;
    }
    set secret (secret) {
        this.#args.token = 'token:'　+ secret;
    }
    get secret () {
        return this.#args.token.slice(6);
    }
    set retries (number) {
        this.#args.retries = isNaN(number) || number < 0 ? Infinity : number;
    }
    get retries () {
        return this.#args.retries;
    }
    set timeout (number) {
        this.#args.timeout = isNaN(number) ? 10000 : number * 1000;
    }
    get timeout () {
        return this.#args.timeout / 1000;
    }
    set onopen (func) {
        this.#args.onopen = typeof func === 'function' ? func : null;
    }
    get onopen () {
        return this.#args.onopen ?? null;
    }
    set onmessage (func) {
        this.#args.onmessage = typeof func === 'function' ? func : null;
    }
    get onmessage () {
        return this.#args.onmessage ?? null;
    }
    set onclose (func) {
        this.#args.onclose = typeof func === 'function' ? func : null;
    }
    get onclose () {
        return this.#args.onclose ?? null;
    }
    connect () {
        let tries = 0;
        let ws = 'ws' + this.#args.ssl + '://' + this.#args.url;
        this.socket = new WebSocket(ws);
        this.socket.onopen = (event) => {
            this.alive = true;
            if (this.#args.onopen) { this.#args.onopen(event); }
        };
        this.socket.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (!response.method) { this.#args.onresponse(response); }
            else if (this.#args.onmessage) { this.#args.onmessage(response); }
        };
        this.socket.onclose = (event) => {
            this.alive = false;
            if (!event.wasClean && tries ++ < this.#args.retries) { setTimeout(() => this.connect(), this.#args.timeout); }
            if (this.#args.onclose) { this.#args.onclose(event); }
        };
    }
    disconnect () {
        this.socket.close();
    }
    call (...args) {
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.#args.token, ...params] }) );
        return new Promise((resolve, reject) => {
            this.#args.onresponse = resolve;
            this.socket.onerror = reject;
            this.socket.send(JSON.stringify(json));
        });
    }
}
