class Aria2WebSocket {
    constructor (...args) {
        let path = args.join('#').match(/^(wss?:\/\/[^#]+)#?(.*)$/);
        if (!path) { throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"'); }
        this.jsonrpc = path[1];
        this.secret = path[2];
        this.params = this.secret ? ['token:' + this.secret] : [];
        this.connect();
    }
    version = '0.8.0';
    timeout = 10000;
    set onopen (callback) {
        this._onopen = typeof callback === 'function' ? callback : null;
    }
    get onopen () {
        return typeof this._onopen === 'function' ? this._onopen : null;
    }
    set onmessage (callback) {
        this._onmessage = typeof callback === 'function' ? callback : null;
    }
    get onmessage () {
        return typeof this._onmessage === 'function' ? this._onmessage : null;
    }
    set onclose (callback) {
        this._onclose = typeof callback === 'function' ? callback : null;
    }
    get onclose () {
        return typeof this._onclose === 'function' ? this._onclose : null;
    }
    connect () {
        this.socket = new WebSocket(this.jsonrpc);
        this.socket.onopen = (event) => {
            this.alive = true;
            if (typeof this._onopen === 'function') { this._onopen(event); }
            resolve(ws);
        };
        this.socket.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (!response.method) { this.socket.resolve(response); }
            else if (typeof this._onmessage === 'function') { this._onmessage(response); }
        };
        this.socket.onclose = (event) => {
            this.alive = false;
            if (!event.wasClean) { setTimeout(() => this.connect(), this.timeout); }
            if (typeof this._onclose === 'function') { this._onclose(event); }
        };
    }
    disconnect () {
        this.socket?.close();
    }
    send (...args) {
        return new Promise((resolve, reject) => {
            this.socket.resolve = resolve;
            this.socket.onerror = reject;
            this.socket.send( JSON.stringify( args.map( ({ method, params = [] }) => ({id: '', jsonrpc: '2.0', method, params: [...this.params, ...params]}) ) ) );
        });
    }
}
