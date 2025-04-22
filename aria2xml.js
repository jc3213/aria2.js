class Aria2XMLRequest {
    constructor (...args) {
        let path = args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/);
        if (!path) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.method = 'POST';
        this.#args.xml = path[1];
        this.secret = path[2];
    }
    version = '1.0';
    #args = {};
    set method (method) {
        this.call = { 'POST': this.post, 'GET': this.get }[ method ];
        if (!this.call) { throw new Error('Unsupported method: "' + method + '"'); }
        this.#args.method = method;
    }
    get method () {
        return this.#args.method;
    }
    set secret (secret) {
        this.#args.token = 'token:'　+ secret;
    }
    get secret () {
        return this.#args.token.slice(6);
    }
    get (...args) {
        return fetch(this.#args.xml + '?params=' + btoa( unescape( encodeURIComponent (this.json(args) ) ) )).then(this.result);
    }
    post (...args) {
        return fetch(this.#args.xml, {method: 'POST', body: this.json(args)}).then(this.result);
    }
    result (response) {
        if (response.ok) { return response.json(); } throw new Error(response.statusText);
    }
    json (args) {
        return JSON.stringify( args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.#args.token, ...params] }) ) );
    }
}
