class Aria2WebSocket {
    constructor (...args) {
        let [, url = 'ws://localhost:6800/jsonrpc', secret = ''] = args.join('#').match(/^(wss?:\/\/[^#]+)#?(.*)$/) ?? [];
        this.url = url;
        this.secret = secret;
    }
    #wsa;
    #tries;
    set url (string) {
        let url = string.match(/^wss?:\/\.+$/)?.[0];
        this.#wsa = url ?? 'ws://localhost:6800/jsonrpc';
        this.#tries = 0;
    }
    get url () {
        return this.#wsa;
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
    #send (json) {
        let id = crypto.randomUUID();
        if (Array.isArray(json)) {
            json = {
                method: 'system.multicall',
                params: [ json.map(({ method, params = [] }) => {
                    params.unshift(this.#secret);
                    return { methodName: method, params };
                }) ]
            };
        } else {
            (json.params ??= []).unshift(this.#secret);
        }
        json.jsonrpc = '2.0';
        json.id = id;
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
            this.#tries = 0;
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
