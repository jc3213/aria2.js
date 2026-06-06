class Aria2 {
    #url;
    #secret;
    #method;
    #id = 0;
    #call;

    constructor(url = 'http://localhost:6800/jsonrpc', secret = '') {
        let rpc = url.split('#');
        this.url = rpc[0];
        this.secret = rpc[1] ?? secret;
        this.method = 'POST';
    }

    set url(string) {
        this.#url = string.replace('ws', 'http');
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
        if (string === 'POST') {
            this.#call = this.#post;
        } else if (string === 'GET') {
            this.#call = this.#get;
        } else {
            throw new TypeError('Invalid method: expected "POST" or "GET".');
        }
        this.#method = string;
    }
    get method() {
        return this.#method;
    }

    call(arg) {
        let { method, params = [] } = arg;
        params.unshift(this.#secret);
        return this.#call({ jsonrpc: '2.0', id: this.#id++, method, params });
    }

    multicall(args) {
        for (let i = 0, l = args.length; i < l; i++) {
            let { method, params = [] } = args[i];
            params.unshift(this.#secret);
            args[i] = { methodName: method, params };
        }
        return this.#call({ jsonrpc: '2.0', id: this.#id++, method: 'system.multicall', params: [args] });
    }

    #then(response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network error: ' + response.status + ' ' + response.statusText);
    }

    #post(json) {
        return fetch(this.#xml, { method: 'POST', body: JSON.stringify(json) }).then(this.#then);
    }

    #get(json) {
        return fetch(this.#url + '?params=' + btoa(unescape(encodeURIComponent(JSON.stringify(json))))).then(this.#then);
    }
}
