const aria2 = (() => {
    let pending = {};
    let index = 0;
    let retries = 10;
    let timeout = 10000;
    let onmessage = null;
    let connection = 0;

    let shared = document.currentScript.src.replace('worker.js', 'shared.js');
    let worker = new SharedWorker(shared, { name: 'aria2-download-utility' });
    let port = worker.port;

    port.start();

    port.onmessage = (event) => {
        let data = event.data;
        let response = data.response;

        if (data.type === 'websocket') {
            if (onmessage) {
                onmessage(response);
            }

            return;
        }

        let id = data.id;

        pending[id](response);
        delete pending[id];
    };
    
    function broadcast(type, payload) {
        let i = index++;
        let id = type + 
            '-' + 
            Date.now().toString(36) +
            '-' +
            i.toString(36).padStart(2, '0') +
            '-' +
            Math.random().toString(36).substring(2);

        return new Promise((resolve) => {
            pending[id] = resolve;
            port.postMessage({ id, type, payload });
        });
    }

    async function connect(jsonrpc, secret, callback) {
        let id = ++connection;

        for (let i = 0; i <= retries; i++) {
            if (id !== connection) {
                return false;
            }

            let result = await broadcast('connect', { jsonrpc, secret });

            if (result.ok) {
                return true;
            }

            if (typeof callback === 'function') {
                callback();
            }

            await new Promise((resolve) => setTimeout(resolve, timeout));
        }

        return false;
    }

    let aria2 = {
        call(method, params) {
            return broadcast('call', { method, params });
        },
        multicall(details) {
            return broadcast('multicall', details);
        },
        connect,
        disconnect() {
            return broadcast('disconnect');
        }
    };

    Object.defineProperty(aria2, 'onmessage', {
        get() {
            return onmessage;
        },
        set(callback) {
            if (typeof callback === 'function') {
                onmessage = callback;
                broadcast('subscribe');
            } else {
                onmessage = null;
                broadcast('unsubscribe');
            }
        }
    });

    Object.defineProperty(aria2, 'retries', {
        get() {
            return retries;
        },
        set(number) {
            let n = number | 0;

            if (number < 0) {
                retries = Infinity;
            } else {
                retries = number;
            }
        }
    });

    Object.defineProperty(aria2, 'timeout', {
        get() {
            return timeout;
        },
        set(number) {
            let n = number | 0;

            if (n > 1) {
                timeout = n * 1000;
            } else {
                timeout = 1000;
            }
        }
    });

    window.addEventListener('unload', () => {
        broadcast('unsubscribe');
    });

    return aria2;
})();
