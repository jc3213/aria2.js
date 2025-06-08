class Aria2 {
    constructor (...args) {
        let path = args.join('#').match(/^(https?|wss?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) {
            throw new Error('Invalid JSON-RPC entry: "' + args.join('", "') + '"');
        }
        this.scheme = path[1];
        this.url = path[2];
        this.secret = path[3];
        this.onmessage = this.onclose = null;
    }
    version = '0.8';
    args = { retry: 10, timeout: 10000, onopen: null, onmessage: null, onclose: null };
    set scheme (scheme) {
        this.call = {
            'http': this.post,
            'https': this.post,
            'ws': this.send,
            'wss': this.send
        }[ scheme ];
        if (!this.call) {
            throw new Error('Invalid JSON-RPC scheme: "' + scheme + '" is not supported!');
        }
        this.args.scheme = scheme;
        this.args.path = scheme + '://' + this.args.url;
    }
    get scheme () {
        return this.args.scheme;
    }
    set url (url) {
        if (this.args.url === url) {
            return;
        }
        this.args.url = url;
        this.args.path = this.args.scheme + '://' + url;
        this.args.ws = this.args.path.replace('http', 'ws');
        this.args.tries = 0;
        this.connect();
    }
    get url () {
        return this.args.url;
    }
    set secret (secret) {
        this.args.secret = 'token:' + secret;
    }
    get secret () {
        return this.args.secret;
    }
    set retries (number) {
        this.args.retries = isNaN(number) || number <= 0 ? Infinity : number;
    }
    get retries () {
        return this.args.retries;
    }
    set timeout (number) {
        this.args.timeout = isNaN(number) ? 10000 : number <= 3 ? 3000 : number * 1000;
    }
    get timeout () {
        return this.args.timeout / 1000;
    }
    set onopen (callback) {
        this.args.onopen = typeof callback === 'function' ? callback : null;
    }
    get onopen () {
        return this.events.onopen;
    }
    set onmessage (callback) {
        this.args.onmessage = typeof callback === 'function' ? callback : null;
    }
    get onmessage () {
        return this.args.onmessage;
    }
    set onclose (callback) {
        this.args.onclose = typeof callback === 'function' ? callback : null;
    }
    get onclose () {
        return this.args.onclose;
    }
    connect () {
        this.disconnect();
        this.socket = new WebSocket(this.args.ws);
        this.socket.onopen = (event) => {
            if (this.args.onopen) {
                this.args.onopen(event);
            }
        };
        this.socket.onmessage = (event) => {
            let response = JSON.parse(event.data);
            if (!response.method) {
                this.socket.resolve(response);
            } else if (this.args.onmessage) {
                this.args.onmessage(response);
            }
        };
        this.socket.onclose = (event) => {
            if (!event.wasClean && this.args.tries < this.args.retries) {
                setTimeout(() => this.connect(), this.args.timeout);
            }
            if (this.args.onclose) {
                this.args.onclose(event);
            }
            this.args.tries++;
        };
    }
    disconnect () {
        this.socket?.close();
    }
    send (...args) {
        return new Promise(async (resolve, reject) => {
            this.socket.resolve = resolve;
            this.socket.onerror = reject;
            this.socket.send(this.json(args));
        });
    }
    post (...args) {
        return fetch(this.args.path, { method: 'POST', body: this.json(args) }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        });
    }
    json (args) {
        let json = args.map(({ method, params = [] }) => {
            return { id: '', jsonrpc: '2.0', method, params: [this.args.secret, ...params] };
        });
        return JSON.stringify(json);
    }
}
