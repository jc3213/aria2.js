class Aria2 {
    #url;
    #secret;
    #id = 0;
    #ws;
    #tries;
    #retries = 10;
    #timeout = 10000;
    #onopen = null;
    #onmessage = null;
    #onclose = null;

    constructor(url = 'ws://localhost:6800/jsonrpc', secret = '') {
        let rpc = url.split('#');
        this.url = rpc[0];
        this.secret = rpc[1] ?? secret;
    }

    set url(string) {
        this.#url = string.replace('http', 'ws');
        this.#tries = 0;
    }
    get url() {
        return this.#url;
    }

    set secret(string) {
        this.#secret = `token:${string}`;
    }
    get secret() {
        return this.#secret.substring(6);
    }

    set retries(number) {
        let n = number | 0;
        this.#retries = n >= 0 ? n : Infinity;
    }
    get retries() {
        return this.#retries;
    }

    set timeout(number) {
        let n = number | 0;
        this.#timeout = n <= 1 ? 1000 : n * 1000;
    }
    get timeout() {
        return this.#timeout / 1000;
    }

    set onopen(callback) {
        this.#onopen = typeof callback === 'function' ? callback : null;
    }
    get onopen() {
        return this.#onopen;
    }

    set onmessage(callback) {
        this.#onmessage = typeof callback === 'function' ? callback : null;
    }
    get onmessage() {
        return this.#onmessage;
    }

    set onclose(callback) {
        this.#onclose = typeof callback === 'function' ? callback : null;
    }
    get onclose() {
        return this.#onclose;
    }

    call(arg) {
        if (Array.isArray(arg)) {
            let calls = [];
            for (let { method, params = [] } of arg) {
                params.unshift(this.#secret);
                calls.push({ methodName: method, params });
            }
            arg = { method: 'system.multicall', params: [calls] };
        } else {
            (arg.params ??= []).unshift(this.#secret);
        }
        let id = this.#id++;
        arg.jsonrpc = '2.0';
        arg.id = id;
        return new Promise((resolve) => {
            this[id] = resolve;
            this.#ws.send(JSON.stringify(arg));
        });
    }

    connect() {
        this.#ws = new WebSocket(this.#url);
        this.#ws.onopen = (event) => {
            this.#tries = 0;
            this.#onopen?.(event);
        };
        this.#ws.onmessage = (event) => {
            let obj = JSON.parse(event.data);
            if (obj.method) {
                this.#onmessage?.(obj);
            } else {
                let { id } = obj;
                this[id](obj);
                delete this[id];
            }
        };
        this.#ws.onclose = (event) => {
            this.#onclose?.(event);
            if (this.#tries++ < this.#retries) {
                setTimeout(() => this.connect(), this.#timeout);
            } else {
                this.#tries = 0;
            }
        };
    }

    disconnect() {
        this.#tries = Infinity;
        this.#ws.close();
    }
}
