class Aria2WebSocket {
    constructor (url, secret) {
        this.jsonrpc = url;
        this.secret = secret;
        this.params = secret ? ['token:' + secret] : [];
        this.connect();
    }
    connect () {
        this.socket?.then( (ws) => ws.close() );
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
    set onmessage (callback) {
        this._onmessage = typeof callback === 'function' ? callback : () => null;
    }
    get onmessage () {
        return this._onmessage;
    }
    set onclose (callback) {
        this._onclose = typeof callback === 'function' ? callback : () => null;
    }
    get onclose () {
        return this._onclose;
    }
    send (...messages) {
        return this.socket.then((ws) => new Promise((resolve, reject) => {
            ws.resolve = resolve;
            ws.onerror = reject;
            ws.send( JSON.stringify( array.map( ({method, params = []}) => ({id: '', jsonrpc: '2.0', method, params: [...this.params, ...params]}) ) ) );
        }));
    }
}
