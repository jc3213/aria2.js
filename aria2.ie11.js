var Aria2 = (function() {
    var properties = `{
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
        if (!url) {
            url = 'http://localhost:6800/jsonrpc';
        }
        if (!secret) {
            secret = '';
        }
        var rpc = url.split('#');
        this.props = JSON.parse(properties);
        this.url = rpc[0];
        this.secret = rpc[1] || secret;
        this.call = function(args, callback) {
            return xmlpost(this, args, callback);
        };
    }

    Object.defineProperty(initiator.prototype, 'url', {
        set: function(string) {
            if (string.indexOf('http://') === 0 || string.indexOf('https://') === 0) {
                this.props.url = this.props.xml = string;
                this.props.wsa = string.replace('http', 'ws');
            } else if (string.indexOf('ws://') === 0 || string.indexOf('wss://') === 0) {
                this.props.xml = string.replace('ws', 'http');
                this.props.url = this.props.wsa = string;
            } else {
                throw new TypeError('Invalid JSON-RPC Endpoint: expected http(s):// or ws(s)://');
            }
        },
        get: function() {
            return this.props.url;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'secret', {
        set: function(string) {
            this.props.secret = 'token:' + string;
        },
        get: function() {
            return this.props.substring(6);
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'retries', {
        set: function(number) {
            var n = number | 0;
            this.props.retries = n >= 0 ? n : Infinity;
        },
        get: function() {
            return this.props.retries;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'timeout', {
        set: function(number) {
            var n = number | 0;
            this.props.timeout = n <= 1 ? 1000 : n * 1000;
        },
        get: function() {
            return this.props.timeout / 1000;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onopen', {
        set: function(callback) {
            this.props.onopen = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return this.props.onopen;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onmessage', {
        set: function(callback) {
            this.props.onmessage = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return this.props.onmessage;
        },
        enumerable: true
    });

    Object.defineProperty(initiator.prototype, 'onclose', {
        set: function(callback) {
            this.props.onclose = typeof callback === 'function' ? callback : null;
        },
        get: function() {
            return this.props.onclose;
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
        var props = instance.props;
        var json = request(args, props);
        var id = json.id;
        props.calls[id] = callback;
        props.socket.send(JSON.stringify(json));
    }

    function xmlpost(instance, args, callback) {
        var props = instance.props;
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
        self.props.socket = new WebSocket(self.props.wsa);
        self.props.socket.onopen = function(event) {
            self.call = function(args, callback) {
                return wssend(self, args, callback);
            };
            self.props.tries = 0;
            if (self.props.onopen) {
                self.props.onopen(event);
            }
        };
        self.props.socket.onmessage = function(event) {
            var json = JSON.parse(event.data);
            if (json.method) {
                if (self.props.onmessage) {
                    self.props.onmessage(json);
                }
            } else {
                var id = json.id;
                if (self.props.calls[id]) {
                    self.props.calls[id](json);
                    delete self.props.calls[id];
                }
            }
        };
        self.props.socket.onclose = function(event) {
            self.call = function(args, callback) {
                return xmlpost(self, args, callback);
            };
            if (self.props.onclose) {
                self.props.onclose(event);
            }
            if (self.props.tries++ < self.props.retries) {
                setTimeout(function() {
                    self.connect();
                }, self.props.timeout);
            } else {
                self.props.tries = 0;
            }
        };
    };

    initiator.prototype.disconnect = function() {
        this.props.tries = Infinity;
        this.props.socket.close();
    }

    return initiator;
})();
