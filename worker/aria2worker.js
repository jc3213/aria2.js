let aria2c = {};
let manager = {};
let jsonrpc = {};
let session = {};
let version = '0.1';
let initFailed;
let syncPeriod;

self.addEventListener('message', (event) => {
    let {action, params} = event.data;
    switch (action) {
        case 'aria2c-setup':
            workerInit(params);
            break;
        case 'aria2c-status':
            workerStatus();
            break;
        case 'aria2c-call':
            workerReponse(params);
            break;
        case 'aria2c-jsonrpc':
            jsonrpcStatus();
            break;
        case 'aria2c-session':
            sessionStatus(params);
            break;
        case 'aria2c-remove':
            sessionRemove(params);
            break;
        case 'aria2c-purge':
            sessionPurge();
            break;
    }
});

function rpcCall(array) {
    return new Promise(async (resolve, reject) => {
        let json = array.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [...aria2c.params, ...params] }) );
        let ws = await aria2c.websocket;
        ws.resolve = resolve;
        ws.onerror = (event) => jsonrpcError(event.error);
        ws.send(JSON.stringify(json));
    });
}

function workerInit({jsonrpc, secret, interval = 10}) {
    aria2c.url = jsonrpc;
    aria2c.interval = interval * 1000;
    aria2c.params = secret ? ['token:' + secret] : [];
    aria2c.websocket = workerOpen(jsonrpc);
    aria2c.call = rpcCall;
    initiator();
}

function workerOpen(jsonrpc) {
    return new Promise((resolve) => {
        let ws = new WebSocket(jsonrpc);
        ws.onopen = (event) => resolve(ws);
        ws.onerror = (event) => jsonrpcError(event.error);
        ws.onmessage = (event) => {
            let response = JSON.parse(event.data);
            response.method ? notifications(response) : ws.resolve(response);
        };
        ws.onclose = (event) => {
            setTimeout(() => {
                workerOpen(jsonrpc);
                initiator();
            }, 10000);
        };
    });
}

function workerStatus() {
    self.postMessage({action: 'aria2c-manager-status', result: {manager, version}});
}

async function workerReponse(params) {
    self.postMessage({action: 'aria2-call-response', result: await aria2c.call(params)});
}

function jsonrpcStatus() {
    self.postMessage({action: 'aria2c-jsonrpc-status', result: jsonrpc});
}

async function sessionPurge() {
    let response = await aria2c.call([ {method: 'aria2.sessionPurgeResult'} ]);
    manager.all = {...manager.active, ...manager.waiting};
    manager.stopped = {};
    jsonrpc.stat['numStopped'] = '0';
}

async function sessionRemove(gid) {
    let session = session.all[gid];
    // working in progress
}

async function sessionStatus(gid) {
    let [status, options] = await aria2c.call([ {method: 'aria2.tellStatus', params: [gid]}, {method: 'aria2.getOption', params: [gid]} ]);
    self.postMessage({action: 'aria2c-session-status', result: {status: status.result, options: options.result}});
}

function sessionStart(result) {
    self.postMessage({action: 'aria2c-session-start', result});
}

function sessionComplete(result) {
    self.postMessage({action: 'aria2c-session-complete', result});
}

function jsonrpcError(error) {
    self.postMessage({action: 'aria2c-jsonrpc-error', error});
}

function initiator(interval) {
    clearTimeout(initFailed);
    clearInterval(syncPeriod);
    session.all = {};
    session.active = {};
    session.waiting = {};
    session.stopped = {};
    aria2c.call([
        {method: 'aria2.getGlobalOption'},
        {method: 'aria2.getVersion'},
        {method: 'aria2.getGlobalStat'},
        {method: 'aria2.tellActive'},
        {method: 'aria2.tellWaiting', params: [0, 999]},
        {method: 'aria2.tellStopped', params: [0, 999]}
    ]).then(([global, version, stats, active, waiting, stopped]) => {
        jsonrpc.options = global.result;
        jsonrpc.version = version.result;
        manager.stats = stats.result;
        manager.active = active.result.map((result) => session.active[result.gid] = session.all[result.gid] = result);
        manager.waiting = waiting.result.map((result) => session.waiting[result.gid] = session.all[result.gid] = result);
        manager.stopped = stopped.result.map((result) => session.stopped[result.gid] = session.all[result.gid] = result);
        update = setInterval(synchronizer, aria2c.interval);
    });
}

async function synchronizer() {
    let [stats, active] = await aria2c.call([ {method: 'aria2.getGlobalStat'}, {method: 'aria2.tellActive'} ]);
    manager.stats = stats.result;
    manager.active = active.result.map((result) => session.active[result.gid] = session.all[result.gid] = result);
}

async function notifications({method, params}) {
    let gid = params[0].gid;
    let response = await aria2c.call([ {method: 'aria2.tellStatus', params: [gid]} ]);
    let result = response[0].result;
    session.all[gid] = result;
    switch (method) {
        case 'aria2.onBtDownloadComplete':
            break;
        case 'aria2.onDownloadStart':
            sessionStart(result);
            if (session.waiting[gid]) {
                removeSession('waiting', gid);
            }
            if (!session.active[gid]) {
                addSession('active', gid, result);
            }
            break;
        case 'aria2.onDownloadComplete':
            sessionComplete(result);
        default:
            if (session.active[gid]) {
                removeSession('active', gid)
                switch (result.status) {
                    case 'waiting':
                    case 'paused':
                        addSession('waiting', gid, result);
                        break;
                    case 'complete':
                    case 'removed':
                    case 'error':
                        addSession('stopped', gid, result);
                        break;
                }
            }
            break;
    }
}

function addSession(type, gid, result) {
    let stat = 'num' + type[0].toUpperCase() + type.slice(1);
    session[type][gid] = result;
    manager[type].push(result);
    manager.stats[stat] ++;
    manager.stats[stat] += '';
}

function removeSession(type, gid) {
    let stat = 'num' + type[0].toUpperCase() + type.slice(1);
    delete session[type][gid];
    manager[type].splice(manager[type].findIndex((result) => result[gid]), 1);
    manager.stats[stat] --;
    manager.stats[stat] += '';
}
