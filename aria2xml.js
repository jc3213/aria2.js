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
        let call = { 'POST': this.#post, 'GET': this.#get }[string];
        if (call) {
            this.#method = string;
            this.call = call;
        } else {
            this.method = 'POST';
            this.call = this.#post;
        }
    }
    get method () {
        return this.#method;
    }
    #xml;
    set url (string) {
        let url = string.match(/^https?:\/\.+$/)?.[0];
        this.#xml = url ?? 'http://localhost:6800/jsonrpc';
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
