class Aria2XMLRequest {
    constructor (...args) {
        let path = args.join('#').match(/^(https?)(?:#|:\/\/)([^#]+)#?(.*)$/) ?? [, 'http', 'localhost:6800/jsonrpc', ''];
        this.method = 'POST';
        this.secret = path[3];
        this.url = `${path[1]}://${path[2]}`;
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
    #jsonrpc;
    set jsonrpc (string) {
        if (!/^https?:\/\/[^/]+\/\w+$/.test(string)) {
            throw new Error (`Unsupported url: "${string}"`);
        }
        this.#jsonrpc = string;
    }
    get jsonrpc () {
        return this.#jsonrpc;
    }
    #secret;
    set secret (secret) {
        this.#secret = `token:${secret}`;
    }
    get secret () {
        return this.#secret.slice(6);
    }
    #get (...args) {
        return fetch(`${this.#url}?params=${btoa(unescape(encodeURIComponent(this.#json(args))))}`).then(this.#then);
    }
    #post (...args) {
        return fetch(this.#url, {method: 'POST', body: this.#json(args)}).then(this.#then);
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
