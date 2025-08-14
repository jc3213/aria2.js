class Aria2WebSocket {
    constructor (...args) {
        let path = args.join('#').match(/^ws(s)?(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) {
            throw new Error(`Unsupported parameters: "${args.join('", "')}"`);
        }
        this.ssl = path[1];
        this.url = path[2];
        this.secret = path[3];
    }
    version = '1.0';
    #wsa;
    #tries;
    #path () {
        this.#wsa = `ws${this.#ssl}://${this.#url}`;
        this.#tries = 0;
    }
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
        this.#secret = `token:${secret}`;
    }
    get secret () {
        return this.#secret.slice(6);
    }
    #retries = 10;
    set retries (number) {
        this.#retries = Number.isInteger(number) && number >= 0 ? number : Infinity;
    }
    get retries () {
        return this.#retries;
    }
    #timeout = 10000;
    set timeout (number) {
        this.#timeout = Number.isFinite(number) && number > 0 ? number * 1000 : 10000;
    }
    get timeout () {
        return this.#timeout / 1000;
    }
    #onopen = null;
    set onopen (callback) {
        this.#onopen = typeof callback === 'function' ? callback : null;
    }
    get onopen () {
        return this.#onopen;
    }
    #onmessage = null;
    set onmessage (callback) {
        this.#onmessage = typeof callback === 'function' ? callback : null;
    }
    get onmessage () {
        return this.#onmessage;
    }
    #onclose = null;
    set onclose (callback) {
        this.#onclose = typeof callback === 'function' ? callback : null;
    }
    get onclose () {
        return this.#onclose;
    }
    #onreceive = null;
    #send (...args) {
        let id = crypto.randomUUID();
        let json = args.map(({ method, params = [] }) => {
            params.unshift(this.#secret);
            return { id, jsonrpc: '2.0', method, params: [this.#secret, ...params] };
        });
        return new Promise((resolve, reject) => {
            this[id] = resolve;
            this.#ws.onerror = reject;
            this.#ws.send(JSON.stringify(json));
        });
    }
    #ws;
    connect () {
        this.#ws = new WebSocket(this.#wsa);
        this.#ws.onopen = (event) => {
            this.#onopen?.(event);
        };
        this.#ws.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (response.method) {
                this.#onmessage?.(response);
            }
            else {
                let [{ id }] = response;
                this[id](response);
                delete this[id];
            }
        };
        this.#ws.onclose = (event) => {
            if (!event.wasClean && this.#tries++ < this.#retries) {
                setTimeout(() => this.connect(), this.#timeout);
            }
            this.#onclose?.(event);
        };
    }
    disconnect () {
        this.#ws.close();
    }
    call = this.#send;
}
