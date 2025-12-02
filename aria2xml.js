class Aria2XMLRequest {
    #url;
    #xml;
    #secret;
    #method;

    constructor(...args) {
        let rpc = args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/);
        this.url = rpc?.[1] ?? 'http://localhost:6800/jsonrpc';
        this.secret = rpc?.[2] ?? '';
        this.method = 'POST';
    }

    set url(string) {
        if (!string.startsWith('http://') && !string.startsWith('https://')) {
            throw new TypeError('Invalid url: expected a valid JSON-RPC endpoint (http:// or https://).');
        }
        this.#url = this.#xml = string;
    }
    get url() {
        return this.#url;
    }

    set secret(string) {
        this.#secret = `token:${string}`;
    }
    get secret() {
        return this.#secret.slice(6);
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
            let params = [ arg.map(({ method, params = [] }) => {
                params.unshift(this.#secret);
                return { methodName: method, params };
            }) ];
            arg = { method: 'system.multicall', params };
        } else {
            (arg.params ??= []).unshift(this.#secret);
        }
        arg.jsonrpc = '2.0';
        arg.id = '';
        return JSON.stringify(arg);
    }

    #then(response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    }

    #post(arg) {
        return fetch(this.#xml, {method: 'POST', body: this.#json(arg)}).then(this.#then);
    }

    #get(arg) {
        return fetch(`${this.#xml}?params=${btoa(unescape(encodeURIComponent(this.#json(arg))))}`).then(this.#then);
    }
}
