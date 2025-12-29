class Aria2XMLRequest {
    #url;
    #secret;
    #id = 0;
    #method;

    constructor(...args) {
        this.url = rpc?.[1] ?? 'http://localhost:6800/jsonrpc';
        this.secret = rpc?.[2] ?? '';
        this.method = 'POST';
    }

    set url(string) {
        this.#url = string.replace('ws', 'http');
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

    set method(string) {
        if (string === 'POST') {
            this.call = this.#post;
        } else if (string === 'GET') {
            this.call = this.#get;
        } else {
            throw new TypeError(`Invalid method: expected "POST" or "GET".`);
        }
        this.#method = string;
    }
    get method() {
        return this.#method;
    }

    #json(arg) {
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
        arg.jsonrpc = '2.0';
        arg.id = this.#id++;
        return JSON.stringify(arg);
    }

    #then(response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    }

    #post(arg) {
        return fetch(this.#url, {method: 'POST', body: this.#json(arg)}).then(this.#then);
    }

    #get(arg) {
        return fetch(`${this.#url}?params=${btoa(unescape(encodeURIComponent(this.#json(arg))))}`).then(this.#then);
    }
}
