class Aria2WebSocket {
    constructor (...args) {
        let path = args.join('#').match(/^ws(s)?:\/\/([^#]+)#?(.*)$/);
        if (!path) { throw new Error('Unsupported parameters: "' + args.join('", "') + '"'); }
        this.ssl = path[1];
        this.url = path[2];
        this.secret = path[3];
    }
    version = '1.0';
    #ssl;
    set ssl (ssl) {
        this.#ssl = ssl ? 's' : '';
        this.#path();
    }
    get ssl () {
        return !!this.#ssl;
    }
    #url;
    set url (url) {
        this.#url = url;
        this.#path();
    }
    get url () {
        return this.#url;
    }
    #secret;
    set secret (secret) {
        this.#secret = 'token:'　+ secret;
    }
    get secret () {
        return this.#secret.slice(6);
    }
    #tries;
    #retries = 10;
    set retries (number) {
        this.#tries = 0;
        this.#retries = isNaN(number) || number < 0 ? Infinity : number;
    }
    get retries () {
        return this.#retries;
    }
    #timeout = 10000;
    set timeout (number) {
        this.#timeout = isNaN(number) ? 10000 : number * 1000;
    }
    get timeout () {
        return this.#timeout / 1000;
    }
    #onopen = null;
    set onopen (func) {
        this.#onopen = typeof func === 'function' ? func : null;
    }
    get onopen () {
        return this.#onopen;
    }
    #onmessage = null;
    set onmessage (func) {
        this.#onmessage = typeof func === 'function' ? func : null;
    }
    get onmessage () {
        return this.#onmessage;
    }
    #onclose = null;
    set onclose (func) {
        this.#onclose = typeof func === 'function' ? func : null;
    }
    get onclose () {
        return this.#onclose;
    }
    #wsa;
    #path () {
        this.#wsa = 'ws' + this.#ssl + '://' + this.#url;
    }
    #socket;
    connect () {
        this.#ws = new WebSocket(this.#wsa);
        this.#ws.onopen = (event) => {
            this.alive = true;
            if (this.#onopen) { this.#onopen(event); }
        };
        this.#ws.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (!response.method) { this.#onrecieve(response); }
            else if (this.#onmessage) { this.#onmessage(response); }
        };
        this.#ws.onclose = (event) => {
            this.alive = false;
            if (!event.wasClean && this.#tries++ < this.#retries) { setTimeout(() => this.connect(), this.#timeout); }
            if (this.#onclose) { this.#onclose(event); }
        };
    }
    disconnect () {
        this.#ws.close();
    }
    #onrecieve = null;
    call (...args) {
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.#secret, ...params] }) );
        return new Promise((resolve, reject) => {
            this.#onrecieve = resolve;
            this.#ws.onerror = reject;
            this.#ws.send( JSON.stringify(json) );
        });
    }
}
