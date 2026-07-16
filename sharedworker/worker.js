const aria2 = (() => {
    let pending = {};
    let hash = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
    let index = 0;
    let retries = 10;
    let timeout = 10;
    let events = {};

    let shared = document.currentScript.src.replace('worker.js', 'shared.js');
    let worker = new SharedWorker(shared, { name: 'aria2-socket-worker' });
    let port = worker.port;

    port.start();

    port.onmessage = (event) => {
        let data = event.data;
        let cast = events[data.type];

        if (cast) {
            cast(data.details);
            return;
        }

        let id = data.id;
        let func = pending[id];

        if (func) {
            func(data.result);
            delete pending[id];
        }
    };

    function broadcast(type, payload) {
        let id = hash + '-' + index++ + '-' + type;

        return new Promise((resolve) => {
            pending[id] = resolve;
            port.postMessage({ id, type, payload });
        });
    }

    let aria2 = {
        call(method, params) {
            return broadcast('call', { method, params });
        },
        multicall(requests) {
            return broadcast('multicall', requests);
        },
        connect(jsonrpc, secret) {
            return broadcast('connect', { jsonrpc, secret });
        },
        disconnect() {
            return broadcast('disconnect');
        },
        subscribe() {
            return broadcast('subscribe');
        },
        unsubscribe() {
            return broadcast('unsubscribe');
        }
    };

    Object.defineProperty(aria2, 'onopen', {
        get() {
            return events['ws:open'];
        },
        set(callback) {
            if (typeof callback === 'function') {
                events['ws:open'] = callback;
            } else {
                events['ws:open'] = null;
            }
        }
    });

    Object.defineProperty(aria2, 'onclose', {
        get() {
            return events['ws:close'];
        },
        set(callback) {
            if (typeof callback === 'function') {
                events['ws:close'] = callback;
            } else {
                events['ws:close'] = null;
            }
        }
    });

    Object.defineProperty(aria2, 'onmessage', {
        get() {
            return events['ws:message'];
        },
        set(callback) {
            if (typeof callback === 'function') {
                events['ws:message'] = callback;
            } else {
                events['ws:message'] = null;
            }
        }
    });

    Object.defineProperty(aria2, 'retries', {
        get() {
            return retries;
        },
        async set(number) {
            let result = await broadcast('retries', number);

            if (result.error) {
                throw new Error(result.error);
            }

            retries = result.ok;
        }
    });

    Object.defineProperty(aria2, 'timeout', {
        get() {
            return timeout;
        },
        async set(number) {
            let result = await broadcast('timeout', number);

            if (result.error) {
                throw new Error(result.error);
            }

            timeout = result.ok;
        }
    });

    return aria2;
})();
