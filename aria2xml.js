class Aria2XMLRequest {
    #url;
    #xml;
    #secret;
    #method;

    constructor (...args) {
        let [, url = 'http://localhost:6800/jsonrpc', secret = ''] =
            args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/) ?? [];
        this.url = url;
        this.secret = secret;
        this.method = 'POST';
    }

    set url (string) {
        let [, ssl = '', url = '://localhost:6800/jsonrpc'] =
            string.match(/^http(s)?(:\/\/.+)$/) ?? [];
        this.#url = this.#xml = `http${ssl}${url}`;
    }
    get url () {
        return this.#url;
    }

    set secret (string) {
        this.#secret = `token:${string}`;
    }
    get secret () {
        return this.#secret.slice(6);
    }

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

    #json (id, arg) {
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
        arg.id = id;
        return JSON.stringify(arg);
    }
    #then (response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    }
    #post (arg) {
        return fetch(this.#xml, {method: 'POST', body: this.#json(arg)}).then(this.#then);
    }
    #get (arg) {
        return fetch(`${this.#xml}?params=${btoa(unescape(encodeURIComponent(this.#json(arg))))}`).then(this.#then);
    }
}
