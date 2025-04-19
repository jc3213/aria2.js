class Aria2XMLRequest {
    constructor (...args) {
        let path = args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/);
        if (!path) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.jsonrpc = path[1];
        this.secret = path[2];
    }
    version = '0.9';
    set secret (secret) {
        this.token = 'token:'　+ secret;
    }
    get secret () {
        return this.token.slice(6);
    }
    get (...args) {
        return fetch(this.jsonrpc + '?params=' + btoa( unescape( encodeURIComponent (this.json(args) ) ) )).then(this.result);
    }
    post (...args) {
        return fetch(this.jsonrpc, {method: 'POST', body: this.json(args)}).then(this.result);
    }
    result (response) {
        if (response.ok) { return response.json(); } throw new Error(response.statusText);
    }
    json (args) {
        return JSON.stringify( args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.token, ...params] }) ) );
    }
}
