var Aria2 = (() => {
    var url;
    var xml;
    var wsa;
    var secret;
    var socket;
    var id = 0;
    var tries = 0;
    var retries = 10;
    var timeout = 10000;
    var onopen = null;
    var onmessage = null;
    var onclose = null;
    var calls = {};

    function initiator(url = 'http://localhost:6800/jsonrpc', secret = '') {
        var rpc = url.split('#');
        this.url = rpc[0];
        this.secret = rpc[1] ?? secret;
        this.call = xmlpost;
    }

    function property(name, action) {
        action.enumerable = true;
        Object.defineProperty(initiator.prototype, name, action);
    }

    Object.defineProperty(initiator.prototype, 'url', {
        set(string) {
            if (string.startsWith('http://') || string.startsWith('https://')) {
                url = xml = string;
                wsa = string.replace('http', 'ws');
            } else if (string.startsWith('ws://') || string.startsWith('wss://')) {
                xml = string.replace('ws', 'http');
                url = wsa = string;
            } else {
                throw new TypeError('Invalid JSON-RPC Endpoint: expected http(s):// or ws(s)://');
            }
        },
        get() {
            return url;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'secret', {
        set(string) {
            secret = 'token:' + string;
        },
        get() {
            return secret.substring(6);
        }
    });

    Object.defineProperty(initiator.prototype, 'retries', {
        set(number) {
            var n = number | 0;
            retries = n >= 0 ? n : Infinity;
        },
        get() {
            return retries;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'timeout', {
        set(number) {
            var n = number | 0;
            timeout = n <= 1 ? 1000 : n * 1000;
        },
        get() {
            return timeout / 1000;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onopen', {
        set(callback) {
            onopen = typeof callback === 'function' ? callback : null;
        },
        get() {
            return onopen;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onmessage', {
        set(callback) {
            onmessage = typeof callback === 'function' ? callback : null;
        },
        get() {
            return onmessage;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onclose', {
        set(callback) {
            onclose = typeof callback === 'function' ? callback : null;
        },
        get() {
            return onclose;
        },
        enumerable: true
    });

    function request(args) {
        if (Array.isArray(args)) {
            var calls = [];
            for (var { method, params = [] } of args) {
                params.unshift(secret);
                calls.push({ methodName: method, params });
            }
            args = { method: 'system.multicall', params: [calls] };
        } else {
            (args.params ??= []).unshift(secret);
        }
        args.jsonrpc = '2.0';
        args.id = id++;
        return args;
    }

    function wssend(args, callback) {
        var json = request(args);
        var id = json.id;
        calls[id] = callback;
        socket.send(JSON.stringify(json));
    }

    function xmlpost(args, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", xml, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function() {
            var json = JSON.parse(xhr.responseText);
            callback(json);
        };
        xhr.send(JSON.stringify(request(args)));
    }

    initiator.prototype.connect = function() {
        socket = new WebSocket(wsa);
        socket.onopen = (event) => {
            this.call = wssend;
            tries = 0;
            if (onopen) {
                onopen(event);
            }
        };
        socket.onmessage = (event) => {
            var json = JSON.parse(event.data);
            if (json.method) {
                if (onmessage) {
                    onmessage(json);
                }
            } else {
                var id = json.id;
                calls[id](json);
                delete calls[id];
            }
        };
        socket.onclose = (event) => {
            this.call = xmlpost;
            if (onclose) {
                onclose(event);
            }
            if (tries++ < retries) {
                setTimeout(() => this.connect(), timeout);
            } else {
                tries = 0;
            }
        };
    }

    initiator.prototype.disconnect = function() {
        tries = Infinity;
        socket.close();
    }

    return initiator;
})();
