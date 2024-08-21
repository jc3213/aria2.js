let aria2c = {};
let jsonrpc = {};
let manager = {};
let initFailed;
let syncPeriod;

self.addEventListener('message', (event) => {
    let {action, params} = event.data;
    switch (action) {
        case 'aria2c-setup':
            webWorker(params);
            break;
        case 'aria2c-purge':
            sessionPurge();
            break;
        case 'aria2c-manager':
            jsonrpcManager();
            break;
        case 'aria2c-jsonrpc':
            jsonrpcStatus();
            break;
        case 'aria2c-session':
            sessionStatus(params);
            break;
    }
});

function webWorker({jsonrpc, secret, interval = 10}) {
    aria2c.url = jsonrpc;
    aria2c.interval = interval * 1000;
    aria2c.params = secret ? ['token:' + secret] : [];
    aria2c.websocket = workerOpen(jsonrpc);
    aria2c.call = workerMessage;
    initiator();
}


function workerOpen(jsonrpc) {
    return new Promise((resolve) => {
        let ws = new WebSocket(jsonrpc);
        ws.onopen = (event) => resolve(ws);
        ws.onerror = (event) => jsonrpcError（event.error);
        ws.onmessage = (event) => {
            let response = JSON.parse(event.data);
            response.method ? notifications : ws.resolve(response);
        };
        ws.onclose = (event) => {
            setTimeout(() => {
                workerOpen(jsonrpc);
                initiator();
            }, 10000);
        };
    });
}

function workerMessage(...args) {
    return new Promise(async (resolve, reject) => {
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [...aria2c.params, ...params] }) );
        let ws = await aria2c.websocket;
        ws.resolve = resolve;
        ws.onerror = (event) => jsonrpcError（event.error);
        ws.send(JSON.stringify(json));
    });
}

function jsonrpcStatus() {
    self.postMessage({action: 'aria2c-jsonrpc-status', params: jsonrpc});
}

function jsonrpcManager() {
    self.postMessage({action: 'aria2c-manager-status', params: manager});
}

async function sessionPurge() {
    let response = await aria2c.call({method: 'aria2.sessionPurgeResult'});
    manager.all = {...manager.active, ...manager.waiting};
    manager.stopped = {};
    jsonrpc.stat['numStopped'] = '0';
}

async function sessionStatus(gid) {
    let [status, option] = await aria2c.call({method: 'aria2.tellStatus', params: [gid]}, {method: 'aria2.getOption', params: [gid]});
    self.postMessage({action: 'aria2c-session-status', params: {detail: status.result, options: option.result}});
}

function sessionStart(params) {
    self.postMessage({action: 'aria2c-session-start', params});
}

function sessionComplete(params) {
    self.postMessage({action: 'aria2c-session-complete', params});
}

function jsonrpcError(error) {
    self.postMessage({action: 'aria2c-jsonrpc-error', error});
}

function initiator(interval) {
    clearTimeout(initFailed);
    clearInterval(syncPeriod);
    manager.all = {};
    manager.active = {};
    manager.waiting = {};
    manager.stopped = {};
    return aria2c.call(
        {method: 'aria2.getGlobalOption'},
        {method: 'aria2.getVersion'},
        {method: 'aria2.getGlobalStat'},
        {method: 'aria2.tellActive'},
        {method: 'aria2.tellWaiting', params: [0, 999]},
        {method: 'aria2.tellStopped', params: [0, 999]}
    ).then((response) => {
        let [global, version, stats, active, waiting, stopped] = response;
        jsonrpc.options = global.result;
        jsonrpc.version = version.result;
        manager.stat = stats.result;
        active.result.forEach((result) => manager.active[result.gid] = manager.all[result.gid] = result);
        waiting.result.forEach((result) => manager.waiting[result.gid] = manager.all[result.gid] = result);
        stopped.result.forEach((result) => manager.stopped[result.gid] = manager.all[result.gid] = result);
        update = setInterval(syncActiveStatus, aria2c.interval);
    });
}

async function syncActiveStatus() {
    let [stats, active] = await aria2c.call({method: 'aria2.getGlobalStat'}, {method: 'aria2.tellActive'});
    manager.stat = stats.result;
    active.result.forEach((result) => manager.active[result.gid] = manager.all[result.gid] = result);
}

async function notifications({method, params}) {
    let gid = params[0].gid;
    let res = await aria2.call({method: 'aria2.tellStatus', params: [gid]});
    let result = res[0].result;
    manager.all[gid] = result;
    switch (method) {
        case 'aria2.onBtDownloadComplete':
            break;
        case 'aria2.onDownloadStart':
            sessionStart(result);
            if (manager.waiting[gid]) {
                delete manager.waiting[gid];
                manager.active[gid] = result;
            }
            break;
        case 'aria2.onDownloadComplete':
            sessionComplete(result);
        default:
            if (manager.active[gid]) {
                delete manager.active[gid];
                switch (result.status) {
                    case 'waiting':
                    case 'paused':
                        manager.waiting[gid] = result;
                        break;
                    case 'complete':
                    case 'removed':
                    case 'error':
                        manager.stopped[gid] = result;
                        break;
                }
            }
            break;
    }
}
