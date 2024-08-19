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
        this._atmessage = typeof callback === 'function';
        this._onmessage = this._atmessage ? callback : () => null;
    }
    get onmessage () {
        return this._atmessage ? this._onmessage : null;
    }
    set onclose (callback) {
        this._atclose = typeof callback === 'function';
        this._onclose = this._atclose ? callback : () => null;
    }
    get onclose () {
        return this._atclose ? this._onclose : null;
    }
    send (...args) {
        return this.socket.then((ws) => new Promise((resolve, reject) => {
            ws.resolve = resolve;
            ws.onerror = reject;
            ws.send( JSON.stringify( args.map( ({ method, params = [] }) => ({id: '', jsonrpc: '2.0', method, params: [...this.params, ...params]}) ) ) );
        }));
    }
}
