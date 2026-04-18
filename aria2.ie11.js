var Aria2 = (function() {
    var properties = new WeakMap();

    var defaultProperties = `{
    "url": null,
    "xml": null,
    "wsa": null,
    "secret": "",
    "socket": null,
    "id": 0,
    "tries": 0,
    "retries": 10,
    "timeout": 10000,
    "onopen": null,
    "onmessage": null,
    "onclose": null,
    "calls": {}
}`;

    function initiator(url, secret) {
        properties.set(this, JSON.parse(defaultProperties));
        if (!url) {
            url = 'http://localhost:6800/jsonrpc';
        }
        if (!secret) {
            secret = '';
        }
        var rpc = url.split('#');
        this.url = rpc[0];
        this.secret = rpc[1] || secret;
        this.call = function(args, callback) {
            return xmlpost(this, args, callback);
        };
    }

    Object.defineProperty(initiator.prototype, 'url', {
        set: function(string) {
            var props = properties.get(this);
            if (string.indexOf('http://') === 0 || string.indexOf('https://') === 0) {
                props.url = props.xml = string;
                props.wsa = string.replace('http', 'ws');
            } else if (string.indexOf('ws://') === 0 || string.indexOf('wss://') === 0) {
                props.xml = string.replace('ws', 'http');
                props.url = props.wsa = string;
            } else {
                throw new TypeError('Invalid JSON-RPC Endpoint: expected http(s):// or ws(s)://');
            }
        },
        get: function() {
            return properties.get(this).url;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'secret', {
        set: function(string) {
            properties.get(this).secret = 'token:' + string;
        },
        get: function() {
            return properties.get(this).substring(6);
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'retries', {
        set: function(number) {
            var n = number | 0;
            properties.get(this).retries = n >= 0 ? n : Infinity;
        },
        get: function() {
            return properties.get(this).retries;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'timeout', {
        set: function(number) {
            var n = number | 0;
            properties.get(this).timeout = n <= 1 ? 1000 : n * 1000;
        },
        get: function() {
            return properties.get(this).timeout / 1000;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onopen', {
        set: function(callback) {
            properties.get(this).onopen = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return properties.get(this).onopen;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onmessage', {
        set: function(callback) {
            properties.get(this).onmessage = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return properties.get(this).onmessage;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onclose', {
        set: function(callback) {
            properties.get(this).onclose = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return properties.get(this).onclose;
        },
        enumerable: true
    });

    function request(args, props) {
        if (Array.isArray(args)) {
            var calls = [];
            for (var i = 0; i < args.length; i++) {
                var req = {
                    methodName: args[i].method,
                    params: args[i].params || []
                };
                req.params.unshift(props.secret);
                calls.push(req);
            }
            args = { method: 'system.multicall', params: [calls] };
        } else {
            if (!args.params) {
                args.params = [];
            }
            args.params.unshift(props.secret);
        }

        args.jsonrpc = '2.0';
        args.id = props.id++;
        return args;
    }

    function wssend(instance, args, callback) {
        var props = properties.get(instance);
        var json = request(args, props);
        var id = json.id;
        props.calls[id] = callback;
        props.socket.send(JSON.stringify(json));
    }

    function xmlpost(instance, args, callback) {
        var props = properties.get(instance);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", xml, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function() {
            var json = JSON.parse(xhr.responseText);
            callback(json);
        };
        xhr.send(JSON.stringify(request(args, props)));
    }

    initiator.prototype.connect = function() {
        var self = this;
        var props = properties.get(this);
        props.socket = new WebSocket(props.wsa);
        props.socket.onopen = function(event) {
            self.call = function(args, callback) {
                return wssend(self, args, callback);
            };
            props.tries = 0;
            if (props.onopen) {
                props.onopen(event);
            }
        };
        props.socket.onmessage = function(event) {
            var json = JSON.parse(event.data);
            if (json.method) {
                if (props.onmessage) {
                    props.onmessage(json);
                }
            } else {
                var id = json.id;
                if (props.calls[id]) {
                    props.calls[id](json);
                    delete props.calls[id];
                }
            }
        };
        props.socket.onclose = function(event) {
            self.call = function(args, callback) {
                return xmlpost(self, args, callback);
            };
            if (props.onclose) {
                props.onclose(event);
            }
            if (props.tries++ < props.retries) {
                setTimeout(function() {
                    self.connect();
                }, props.timeout);
            } else {
                props.tries = 0;
            }
        };
    };

    initiator.prototype.disconnect = function() {
        var props = properties.get(this);
        props.tries = Infinity;
        props.socket.close();
    }

    return initiator;
})();
