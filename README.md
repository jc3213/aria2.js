## Usage

### Download
[Latest](https://jc3213.github.io/jslib/aria2/aria2.js)

### HTML
```HTML
<script src="https://jc3213.github.io/jslib/aria2/aria2.js"></script>
```

### TamperMonkey
```javascript
// @require https://jc3213.github.io/jslib/aria2/aria2.js
```

## Syntax
```javascript
let aria2 = new Aria2("http://localhost:6800/jsonrpc", "mysecret");
let aria2 = new Aria2("http", "localhost:6800/jsonrpc", "mysecret"); // Requires 0.2.0~
let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret"); // Requires 0.4.0~
```

## Getter & Setter
- [scheme](#scheme)
- [url](#url)
- [secret](#secret)
- [onmessage](#onmessage)
- [onclose](#onclose)

## Method
- [call](#call)
    - Use `WebSocket` or `HTTP Post` based on [scheme](#scheme)
- [send](#call)
    - Use `WebSocket` method only
- [post](#call)
    - Use `HTTP Post` method only

### scheme
```javascript
console.log(aria2.scheme); // current scheme
aria2.scheme = scheme; // set new scheme
```
- Requires 0.2.0~
- scheme
    - `http`, `https`, `ws`, and `wss`

### url
```javascript
console.log(aria2.url); // current url
aria2.url = url; // set new url
```
- Requires 0.3.0~
- url
    - `${hostname}:${port}/jsonrpc`
- hostname
    - `www.example.com`
- port
    - `6800` *default*
    - `443` for SSL

### secret
```javascript
console.log(aria2.secret); // current secret token
aria2.secret = secret; // set new secret token
```
- Requires 0.3.0~
- secret
    - `string`, secret token of aria2 json-rpc
    - returns `${secret}`

### onmessage
```javascript
console.log(aria2.onmessage); // current message event listener
aria2.onmessage = callback; // set new message event listener
```
- Requires 0.2.0~
- Handle the event when `WebSocket` message is recieved
- callback
    - `function`, (response) => void
    - returns `${callback}`
    - Used for JSON-RPC over WebSocket notifications

### onclose
```javascript
console.log(aria2.onclose); // current message event listener
aria2.onclose = callback; // set new message event listener
```
- Requires 0.5.0~
- Handle the event when `WebSocket` connection is closed
- callback
    - `function`, (event) => void
    - returns `${callback}`
    - It will run when WebSocket connection is closed

### call
```javascript
let response = aria2.call( { method, params } );
let response = aria2.call( { method, params }, { method, params }, ..., { method, params } );
```
- response
    - `Promise` object, return an array that contains the response from jsonrpc if fulfilled
- method **required**
    - Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)
- params **optional**
    - JSON-RPC method call parameters

### Code Sample
```javascript
let jsonrpc = {};
let session = {};
let retry;
let update;
let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");
aria2.onmessage = aria2WebsocketNotification;
aria2.onclose = aria2ClientInitiate;
aria2ClientInitiate();

function aria2ClientInitiate() {
    clearTimeout(retry);
    clearInterval(update);
    session.all = {};
    session.active = {};
    session.waiting = {};
    session.stopped = {};
    aria2.call(
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
        jsonrpc.stat = stats.result;
        active.result.forEach((result) => session.active[result.gid] = session.all[result.gid] = result);
        waiting.result.forEach((result) => session.waiting[result.gid] = session.all[result.gid] = result);
        stopped.result.forEach((result) => session.stopped[result.gid] = session.all[result.gid] = result);
        update = setInterval(aria2UpdateStats, 10000);
    }).catch((error) => {
        retry = setTimeout(aria2JsonrpcInitiate, 5000);
    });
}

async function aria2UpdateStats() {
    let response = await aria2RPC.call({method: 'aria2.getGlobalStat'}, {method: 'aria2.tellActive'});
    let [stats, active] = response;
    jsonrpc.stat = stats.result;
    active.result.forEach((result) => session.active[result.gid] = session.all[result.gid] = result);
}

async function aria2PurgeDownload() {
    let response = await aria2RPC.call({method: 'aria2.purgeDownloadResult'});
    session.all = {...session.active, ...session.waiting};
    session.stopped = {};
    jsonrpc.stat['numStopped'] = '0';
}

async function aria2WebsocketNotification(response) {
    if (!response.method) { return; }
    let gid = response.params[0].gid;
    let res = await aria2.call({method: 'aria2.tellStatus', params: [gid]});
    let result = res[0].result;
    switch (response.method) {
        case 'aria2.onBtDownloadComplete':
            break;
       case 'aria2.onDownloadStart':
            console.log("The session #" + gid + " has started");
            if (session.waiting[gid]) {
                delete session.waiting[gid];
                session.active[gid] = result;
            }
            break;
       case 'aria2.onDownloadComplete':
            console.log("The session #" + gid + " has completed");
       default:
            if (session.active[gid]) {
                delete session.active[gid];
                switch (result.status) {
                    case 'waiting':
                    case 'paused':
                        session.waiting[gid] = result;
                        break;
                    case 'complete':
                    case 'removed':
                    case 'error':
                        session.stopped[gid] = result;
                        break;
                }
            }
            break;
    }
}
```
