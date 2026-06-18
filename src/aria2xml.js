class Aria2 {
    #url;
    #secret;
    #id = 0;
    #method;
    #call;

    constructor(url, secret) {
        if (!url) {
            this.url = 'http://localhost:6800/jsonrpc';
            this.secret = '';
        } else {
            let i = url.indexOf('#');
            if (i !== -1) {
                this.url = url.substring(0, i);
                this.secret = url.substring(i + 1);
            } else {
                this.url = url;
                this.secret = secret || '';
            }
        }

        this.method = 'POST';
    }

    set url(string) {
        if (string.startsWith('http://') || string.startsWith('https://')) {
            this.#url = string;
        } else if (string.startsWith('ws://') || string.startsWith('wss://')) {
            this.#url = 'http' + string.substring(2);
        } else {
            throw new TypeError('Invalid URL: expected a valid http(s):// URL');
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

    set method(string) {
        let method = string.toUpperCase();

        if (method === 'POST') {
            this.#call = this.#post;
        } else if (method === 'GET') {
            this.#call = this.#get;
        } else {
            throw new TypeError('Invalid method: expected "POST" or "GET"');
        }

        this.#method = method;
    }
    get method() {
        return this.#method;
    }

    #post(json) {
        return fetch(this.#url, { method: 'POST', body: JSON.stringify(json) }).then(this.#then);
    }

    #get(json) {
        return fetch(this.#url + '?params=' + btoa(unescape(encodeURIComponent(JSON.stringify(json))))).then(this.#then);
    }

    #then(response) {
        if (response.ok) {
            return response.json();
        }

        throw new Error('Network error: ' + response.status + ' ' + response.statusText);
    }

    call(method, params) {
        if (params) {
            params = [this.#secret].concat(params);
        } else {
            params = [this.#secret];
        }

        return this.#call({ jsonrpc: '2.0', id: this.#id++, method, params });
    }

    multicall(args) {
        let calls = [];
        let secret = this.#secret;

        for (let i = 0, l = args.length; i < l; i++) {
            let arg = args[i];
            let params = arg.params;

            if (params) {
                params = [secret].concat(params);
            } else {
                params = [secret];
            }

            calls[i] = { methodName: arg.methodName, params };
        }

        return this.#call({ jsonrpc: '2.0', id: this.#id++, method: 'system.multicall', params: [calls] });
    }
}
