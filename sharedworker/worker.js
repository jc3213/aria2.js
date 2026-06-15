const aria2 = (() => {
    let pending = {};
    let index = 0;
    let retries = 10;
    let interval = 10000;
    let onmessage = null;

    let shared = new URL('shared.js', document.currentScript.src).href;
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
        let id = index++;
        id = type + 
            '-' + 
            Date.now().toString(36) +
            '-' +
            index.toString(36).padStart(2, '0') +
            '-' +
            Math.random().toString(36).substring(2);
        return new Promise((resolve, reject) => {
            pending[id] = resolve;
            port.postMessage({ id, type, payload });
        });
    }

    async function connect(jsonrpc, secret) {
        for (let i = 0; i <= retries; i++) {
            let result = await broadcast('connect', { jsonrpc, secret });
            if (result.ok) {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, timer));
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
        disconnect(details) {
            return broadcast('disconnect', details);
        }
    };

    Object.defineProperty(aria2, 'onmessage', {
        get() {
            return onmessage;
        },
        set(callback) {
            if (typeof callback === 'function') {
                onmessage = callback;
            } else {
                onmessage = null;
            }
        }
    });

    Object.defineProperty(aria2, 'retries', {
        get() {
            return retries;
        },
        set(number) {
            if (number >= 0) {
                retries = number;
            } else if (number < 0) {
                retries = Infinity;
            } else {
                retries = 10;
            }
        }
    });

    Object.defineProperty(aria2, 'interval', {
        get() {
            return interval;
        },
        set(callback) {
            if (interval > 1000) {
                interval = interval;
            } else if (interval > 3 && interval <= 60) {
                interval = interval * 1000;
            } else {
                interval = 10000;
            }
        }
    });

    return aria2;
})();
