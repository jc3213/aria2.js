const aria2 = (() => {
    let hash = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
    let index = 0;

    let pending = new Map();
    let handlers = {};

    let options = new Set(['retries', 'timeout']);
    let events = new Set(['open', 'message', 'close']);

    let shared = document.currentScript.src.replace('worker-client.js', 'socket-worker.js');
    let worker = new SharedWorker(shared, { name: 'aria2-socket-worker' });
    let port = worker.port;

    port.start();

    port.onmessage = (event) => {
        let data = event.data;
        let id = data.id;

        let func = pending.get(id);

        if (func) {
            pending.delete(id);
            func(data.result);
            return;
        }

        let post = handlers[data.type];

        if (post) {
            post(data.details);
            return;
        }
    };

    function broadcast(type, payload) {
        let id = hash + '-' + index++ + '-' + type;

        return new Promise((resolve) => {
            pending.set(id, resolve);
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
        },
        set(key, value) {
            if (!options.has(key)) {
                throw new Error('Invalid option key');
            }

            return broadcast(key, value);
        },
        get(key) {
            if (!options.has(key)) {
                throw new Error('Invalid option key');
            }

            return broadcast(key);
        },
        on(type, callback) {
            if (!events.has(type)) {
                throw new Error('Invalid event type');
            }

            if (typeof callback === 'function') {
                handlers['ws:' + type] = callback;
            } else {
                handlers['ws:' + type] = null;
            }
        },
        has(type) {
            if (!events.has(type)) {
                throw new Error('Invalid event type');
            }

            return handlers['ws:' + type];
        }
    };

    window.addEventListener('pagehide', (event) => {
        aria2.unsubscribe();
    });

    return aria2;
})();
