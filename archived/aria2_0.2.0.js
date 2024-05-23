class Aria2 {
    constructor (scheme, url, secret) {
        this.url = url;
        this.secret = 'token:' + secret;
        this.scheme = scheme;
        this.connect();
    }
    set scheme (scheme) {
        this.call = { 'http': this.post, 'https': this.post, 'ws': this.send, 'wss': this.send }[ scheme ];
        if (!this.call) { throw new Error('Invalid method: ' + scheme + ' is not supported!'); }
        this.jsonrpc = scheme + '://' + this.url;
    }
    connect () {
        this.websocket = new Promise((resolve, reject) => {
            const websocket = new WebSocket(this.jsonrpc.replace('http', 'ws'));
            websocket.onopen = (event) => resolve(websocket);
            websocket.onerror = (error) => reject(error);
        });
    }
    disconnect () {
        this.websocket.then( (websocket) => websocket.close() );
    }
    set onmessage (callback) {
        this.websocket.then( (websocket) => websocket.addEventListener('message', (event) => callback(JSON.parse(event.data))) );
    }
    send (...messages) {
        return this.websocket.then((websocket) => new Promise((resolve, reject) => {
            websocket.onmessage = (event) => resolve(JSON.parse(event.data));
            websocket.onerror = (error) => reject(error);
            websocket.send(this.json(messages));
        }));
    }
    post (...messages) {
        return fetch(this.jsonrpc, {method: 'POST', body: this.json(messages)}).then((response) => {
            if (response.ok) { return response.json(); }
            throw new Error(response.statusText);
        });
    }
    json (array) {
        const json = array.map( ({method, params = []}) => ({ id: '', jsonrpc: '2.0', method, params: [this.secret, ...params] }) );
        return JSON.stringify(json);
    }
}
