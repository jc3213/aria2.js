class Aria2XMLRequest {
    constructor (...args) {
        let path = args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/);
        if (!path) { throw new Error('Unsupported parameters: "' + args.join('", "') + '"'); }
        this.method = 'POST';
        this.#url = path[1];
        this.secret = path[2];
    }
    version = '1.0';
    #method;
    set method (method) {
        this.call = { 'POST': this.#post, 'GET': this.#get }[ method ];
        if (!this.call) { throw new Error('Unsupported method: "' + method + '"'); }
        this.#method = method;
    }
    get method () {
        return this.#method;
    }
    #url;
    #secret;
    set secret (secret) {
        this.#secret = 'token:'　+ secret;
    }
    get secret () {
        return this.#secret.slice(6);
    }
    #get (...args) {
        return fetch(this.#url + '?params=' + btoa( unescape( encodeURIComponent (this.#json(args) ) ) )).then(this.#then);
    }
    #post (...args) {
        return fetch(this.#url, {method: 'POST', body: this.#json(args)}).then(this.#then);
    }
    #then (response) {
        if (response.ok) { return response.json(); } throw new Error(response.statusText);
    }
    #json (args) {
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.#secret, ...params] }) );
        return JSON.stringify( json );
    }
}
