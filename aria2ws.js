class Aria2WebSocket {
    constructor (...args) {
        let path = args.join('#').match(/^(wss?:\/\/[^#]+)#?(.*)$/);
        if (!path) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.jsonrpc = path[1];
        this.secret = path[2];
        this.params = this.secret ? ['token:' + this.secret] : [];
        this.connect();
    }
    connect () {
        this.socket = new Promise((resolve, reject) => {
            let ws = new WebSocket(this.jsonrpc);
            ws.onopen = (event) => resolve(ws);
            ws.onmessage = (event) => {
                let response = JSON.parse(event.data);
                response.method ? this._onmessage(response) : ws.resolve(response);
            };
            ws.onclose = (event) => {
                if (!event.wasClean) { setTimeout(() => this.connect(), 5000); }
                this._onclose(event);
            };
        });
    }
    disconnect () {
        this.socket.then( (ws) => ws.close() );
    }
    set onmessage (callback) {
        this._onmessage = typeof callback === 'function' ? callback : () => null;
    }
    get onmessage () {
        return this._onmessage.toString() === '() => null' ? null : this._onmessage;
    }
    set onclose (callback) {
        this._onclose = typeof callback === 'function' ? callback : () => null;
    }
    get onclose () {
        return this._onclose.toString() === '() => null' ? null : this._onclose;
    }
    send (...args) {
        return this.socket.then((ws) => new Promise((resolve, reject) => {
            ws.resolve = resolve;
            ws.onerror = reject;
            ws.send( JSON.stringify( args.map( ({method, params = []}) => ({id: '', jsonrpc: '2.0', method, params: [...this.params, ...params]}) ) ) );
        }));
    }
}
