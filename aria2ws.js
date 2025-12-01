class Aria2 {
    #url;
    #wsa;
    #secret;
    #ws;
    #tries;
    #retries = 10;
    #timeout = 10000;
    #onopen = null;
    #onmessage = null;
    #onclose = null;

    constructor(...args) {
        let rpc = args.join('#').match(/^(wss?:\/\/[^#]+)#?(.*)$/);
        this.url = rpc?.[1] ?? 'ws://localhost:6800/jsonrpc';
        this.secret = rpc?.[2] ?? '';
        this.call = this.#send;
    }

    set url(string) {
        let rpc = string.match(/^wss?:\/\/.*$/);
        if (!rpc) {
            Aria2.#error('be a URI starts with ws');
        }
        this.#url = this.#wsa = string;
        this.#tries = 0;
    }
    get url() {
        return this.#url;
    }

    set secret(string) {
        if (typeof string !== 'string') {
            Aria2.#error('be a string');
        }
        this.#secret = `token:${string}`;
    }
    get secret() {
        return this.#secret.slice(6);
    }

    set retries(number) {
        if (!Number.isInteger(number)) {
            Aria2.#error('be an integer');
        }
        this.#retries = number >= 0 ? number : Infinity;
    }
    get retries() {
        return this.#retries;
    }

    set timeout(number) {
        if (!Number.isInteger(number) || number <= 0) {
            Aria2.#error('be a positive integer');
        }
        this.#timeout = number * 1000;
    }
    get timeout() {
        return this.#timeout / 1000;
    }

    set onopen(callback) {
        if (callback !== null && typeof callback !== 'function') {
            Aria2.#error('be a function or null');
        }
        this.#onopen = callback;
    }
    get onopen() {
        return this.#onopen;
    }

    set onmessage(callback) {
        if (callback !== null && typeof callback !== 'function') {
            Aria2.#error('be a function or null');
        }
        this.#onmessage = callback;
    }
    get onmessage() {
        return this.#onmessage;
    }

    set onclose(callback) {
        if (callback !== null && typeof callback !== 'function') {
            Aria2.#error('be a function or null');
        }
        this.#onclose = callback;
    }
    get onclose() {
        return this.#onclose;
    }

    #json(id, arg) {
        if (Array.isArray(arg)) {
            let params = [ arg.map(({ method, params = [] }) => {
                params.unshift(this.#secret);
                return { methodName: method, params };
            }) ];
            arg = { method: 'system.multicall', params };
        } else {
            (arg.params ??= []).unshift(this.#secret);
        }
        arg.jsonrpc = '2.0';
        arg.id = id;
        return JSON.stringify(arg);
    }
    #send(arg) {
        return new Promise((resolve, reject) => {
            let id = crypto.randomUUID();
            this[id] = resolve;
            this.#ws.onerror = reject;
            this.#ws.send(this.#json(id, arg));
        });
    }

    connect() {
        this.#ws = new WebSocket(this.#wsa);
        this.#ws.onopen = (event) => {
            this.#tries = 0;
            this.#onopen?.(event);
        };
        this.#ws.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (response.method) {
                this.#onmessage?.(response);
            } else {
                let { id } = response;
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
    disconnect() {
        this.#ws.close();
    }

    static #error(string) {
        throw new TypeError(`Parameter 1 must ${string}!`);
    }
}
