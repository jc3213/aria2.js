var Aria2 = (function() {
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

    function initiator(url, secret) {
        if (!url) {
            url = 'http://localhost:6800/jsonrpc';
        }
        if (!secret) {
            secret = '';
        }
        var rpc = url.split('#');
        this.url = rpc[0];
        this.secret = rpc[1] || secret;
        this.call = xmlpost;
    }

    Object.defineProperty(initiator.prototype, 'url', {
        set: function(string) {
            if (string.indexOf('http://') === 0 || string.indexOf('https://') === 0) {
                url = xml = string;
                wsa = string.replace('http', 'ws');
            } else if (string.indexOf('ws://') === 0 || string.indexOf('wss://') === 0) {
                xml = string.replace('ws', 'http');
                url = wsa = string;
            } else {
                throw new TypeError('Invalid JSON-RPC Endpoint: expected http(s):// or ws(s)://');
            }
        },
        get: function() {
            return url;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'secret', {
        set: function(string) {
            secret = 'token:' + string;
        },
        get: function() {
            return secret.substring(6);
        }
    });

    Object.defineProperty(initiator.prototype, 'retries', {
        set: function(number) {
            var n = number | 0;
            retries = n >= 0 ? n : Infinity;
        },
        get: function() {
            return retries;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'timeout', {
        set: function(number) {
            var n = number | 0;
            timeout = n <= 1 ? 1000 : n * 1000;
        },
        get: function() {
            return timeout / 1000;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onopen', {
        set: function(callback) {
            onopen = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return onopen;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onmessage', {
        set: function(callback) {
            onmessage = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return onmessage;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onclose', {
        set: function(callback) {
            onclose = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return onclose;
        },
        enumerable: true
    });

    function request(args) {
        if (Array.isArray(args)) {
            var calls = [];
            for (var i = 0; i < args.length; i++) {
                var req = {
                    methodName: args[i].method,
                    params: args[i].params || []
                };
                req.params.unshift(secret);
                calls.push(req);
            }
            args = { method: 'system.multicall', params: [calls] };
        } else {
            if (!args.params) {
                args.params = [];
            }
            args.params.unshift(secret);
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
        var self = this;
        socket = new WebSocket(wsa);
        socket.onopen = function(event) {
            self.call = wssend;
            tries = 0;
            if (onopen) {
                onopen(event);
            }
        };
        socket.onmessage = function(event) {
            var json = JSON.parse(event.data);
            if (json.method) {
                if (onmessage) {
                    onmessage(json);
                }
            } else {
                var id = json.id;
                console.log(json);
                calls[id](json);
                delete calls[id];
            }
        };
        socket.onclose = function(event) {
            self.call = xmlpost;
            if (onclose) {
                onclose(event);
            }
            if (tries++ < retries) {
                setTimeout(function() {
                    self.connect()
                }, timeout);
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
