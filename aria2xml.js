class Aria2XMLRequest {
    constructor (...args) {
        let [, url = 'http://localhost:6800/jsonrpc', secret = ''] = args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/) ?? [];
        this.url = url;
        this.secret = secret;
        this.method = 'POST';
    }
    #method;
    set method (string) {
        let call = { 'POST': this.#post, 'GET': this.#get }[string];
        if (call) {
            this.#method = string;
            this.call = call;
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
    #get (arg) {
        return fetch(`${this.#xml}?params=${btoa(unescape(encodeURIComponent(this.#json(arg))))}`).then(this.#then);
    }
    #post (arg) {
        return fetch(this.#xml, {method: 'POST', body: this.#json(arg)}).then(this.#then);
    }
    #then (response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    }
    #json (arg) {
        if (Array.isArray(arg)) {
            arg = {
                method: 'system.multicall',
                params: [ arg.map(({ method, params = [] }) => {
                    params.unshift(this.#secret);
                    return { methodName: method, params };
                }) ]
            };
        } else {
            (arg.params ??= []).unshift(this.#secret);
        }
        arg.jsonrpc = '2.0';
        arg.id = ‘’;
        return JSON.stringify(arg);
    }
}
