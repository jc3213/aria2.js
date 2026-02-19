class Aria2 {
    #url;
    #secret;
    #method;
    #id = 0;

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
            this.call = this.#post;
        } else if (string === 'GET') {
            this.call = this.#get;
        } else {
            throw new TypeError('Invalid method: expected "POST" or "GET".');
        }
        this.#method = string;
    }
    get method() {
        return this.#method;
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
        return JSON.stringify(obj);
    }

    #then(response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network error: ' + response.status + ' ' + response.statusText);
    }

    #post(obj) {
        return fetch(this.#url, { method: 'POST', body: this.#json(obj) }).then(this.#then);
    }

    #get(obj) {
        return fetch(this.#url + '?params=' + btoa(unescape(encodeURIComponent(this.#json(obj))))).then(this.#then);
    }
}
