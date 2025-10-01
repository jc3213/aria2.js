class Aria2XMLRequest {
    constructor (...args) {
        let [, url = 'http://localhost:6800/jsonrpc', secret = ''] = args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/) ?? [];
        this.url = url;
        this.secret = secret;
        this.method = 'POST';
    }
    version = '1.0';
    #method;
    set method (string) {
        if (string === 'POST') {
            this.call = this.#post;
        } else if (string === 'GET') {
            this.call = this.#get;
        } else {
            throw new Error(`Unsupported method: "${method}"`);
        }
        this.#method = string;
    }
    get method () {
        return this.#method;
    }
    #xml;
    set url (string) {
        let [, ssl = '', url = '://localhost:6800/jsonrpc'] = string.match(/^http(s)?(:\/\/.+)$/) ?? [];
        this.#xml = `http${ssl}${url}`;
    }
    get jsonrpc () {
        return this.#xml;
    }
    #secret;
    set secret (secret) {
        this.#secret = `token:${secret}`;
    }
    get secret () {
        return this.#secret.slice(6);
    }
    #get (...args) {
        return fetch(`${this.#xml}?params=${btoa(unescape(encodeURIComponent(this.#json(args))))}`).then(this.#then);
    }
    #post (...args) {
        return fetch(this.#xml, {method: 'POST', body: this.#json(args)}).then(this.#then);
    }
    #then (response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    }
    #json (args) {
        return JSON.stringify(args.map((arg) => {
            arg.jsonrpc = '2.0';
            arg.id = '';
            ( arg.params ??= [] ).unshift(this.#secret);
            return arg;
        }));
    }
}
