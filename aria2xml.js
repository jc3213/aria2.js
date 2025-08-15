class Aria2XMLRequest {
    constructor (...args) {
        let path = args.join('#').match(/^(https?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) {
            throw new Error(`Unsupported parameters: "${args.join('", "')}"`);
        }
        this.method = 'post';
        this.secret = path[3];
        this.url = `${path[1]}://${path[2]}`;
    }
    version = '1.0';
    #method;
    set method (method) {
        if (!/^(post|get)$/i.test(method)) {
            throw new Error(`Unsupported method: "${method}"`);
        }
        this.call = method.toLowerCase() === 'post' ? this.#post : this.#get;
        this.#method = method;
    }
    get method () {
        return this.#method;
    }
    #url;
    set url (url) {
        if (!/^https?:\/\/[^/]+\/\w+$/.test(url)) {
            throw new Error (`Unsupported url: "${url}"`);
        }
        this.#url = url;
    }
    get url () {
        return this.#url;
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
            arg.id = id;
            ( arg.params ??= [] ).unshift(this.#secret);
            return arg;
        }));
    }
}
