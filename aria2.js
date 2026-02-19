class Aria2 {
    #url;
    #xml;
    #wsa;
    #secret;
    #ws;
    #id = 0;
    #tries = 0;
    #retries = 10;
    #timeout = 10000;
    #onopen = null;
    #onmessage = null;
    #onclose = null;

    constructor(url = 'http://localhost:6800/jsonrpc', secret = '') {
        let rpc = url.split('#');
        this.url = rpc[0];
        this.secret = rpc[1] ?? secret;
        this.call = this.#post;
    }

    set url(string) {
        if (string.startsWith('http://') || string.startsWith('https://')) {
            this.#url = this.#xml = string;
            this.#wsa = string.replace('http', 'ws');
        } else if (string.startsWith('ws://') || string.startsWith('wss://')) {
            this.#xml = string.replace('ws', 'http');
            this.#url = this.#wsa = string;
        } else {
            throw new TypeError('Invalid JSON-RPC Endpoint: expected http(s):// or ws(s)://');
        }
    }
    get url() {
        return this.#url;
    }

    set secret(string) {
        this.#secret = 'token:' + string;
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

    #json(obj) {
        if (Array.isArray(obj)) {
            let calls = [];
            for (let { method, params = [] } of obj) {
                params.unshift(this.#secret);
                calls.push({ methodName: method, params });
            }
            obj = { method: 'system.multicall', params: [calls] };
        } else {
            (obj.params ??= []).unshift(this.#secret);
        }
        obj.jsonrpc = '2.0';
        obj.id = this.#id++;
        return obj;
    }

    #send(obj) {
        return new Promise((resolve, reject) => {
            let json = this.#json(obj);
            this[json.id] = resolve;
            this.#ws.onerror = reject;
            this.#ws.send(JSON.stringify(json));
        });
    }

    #post(obj) {
        return fetch(this.#xml, { method: 'POST', body: JSON.stringify(this.#json(obj)) }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network error: ' + response.status + ' ' + response.statusText);
        });
    }

    connect() {
        this.#ws = new WebSocket(this.#wsa);
        this.#ws.onopen = (event) => {
            this.call = this.#send;
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
            this.call = this.#post;
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
