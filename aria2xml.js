class Aria2XMLRequest {
    constructor (...args) {
        let path = args.join('#').match(/^(https?:\/\/[^#]+)#?(.*)$/);
        if (!path) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.jsonrpc = path[1];
        this.secret = path[2];
        this.params = this.secret ? ['token:' + this.secret] : [];
    }
    get (...messages) {
        return fetch(this.jsonrpc + '?params=' + btoa(unescape(encodeURIComponent(this.json(messages))))).then(this.result);
    }
    post (...messages) {
        return fetch(this.jsonrpc, {method: 'POST', body: this.json(messages)}).then(this.result);
    }
    result (response) {
        if (response.ok) { return response.json(); } throw new Error(response.statusText);
    }
    json (args) {
        return JSON.stringify(args.map( ({method, params = []}) => ({ id: '', jsonrpc: '2.0', method, params: [...this.params, ...params] }) ));
    }
}
