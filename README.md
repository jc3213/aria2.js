# aria2.js

| Lastest | Extension | Web App |
| - | - | - |
| [aria2.js](https://jc3213.github.io/aria2.js/aria2.js) | [Download with Aria2](https://jc3213.github.io/download_with_aria2/) | [Task Manager](https://jc3213.github.io/aria2.js/app/) |

### HTML
```HTML
<script src="https://jc3213.github.io/aria2.js/aria2.js"></script>
```

### TamperMonkey
```javascript
// @require https://jc3213.github.io/aria2.js/aria2.js
```

## Syntax
```javascript
let aria2 = new Aria2("http://localhost:6800/jsonrpc", "mysecret");
let aria2 = new Aria2("http", "localhost:6800/jsonrpc", "mysecret"); // Requires 0.2.0~
let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret"); // Requires 0.4.0~
```

## Method
- [connect](#connect)
- [disconnect](#disconnect)
- [call](#call)

### connect
```javascript
aria2.connect();
```
- Requires 0.2~
- Connect to `WebSocket` of aria2 JSON-RPC
- *0.2*~*0.8*
    - Run when `Aria` instance is initialized, or [url](#url) is changed
- *0.8*~
    - Run at yourself

### disconnect
```javascript
aria2.disconnect();
```
- Requires 0.2~
- Disconnect from `WebSocket` of aria2 JSON-RPC
- *0.2*~*0.8*
    - Run when `Aria` instance is initialized, or [url](#url) is changed
- *0.8*~
    - Run at yourself

### call
```javascript
let response = aria2.call( { method, params } );
let response = aria2.call( { method, params }, { method, params }, ..., { method, params } );
```
- Use `WebSocket` or `HTTP Post` method based on [scheme](#scheme)
- response
    - `Promise` object, return an array that contains the response from JSON-RPC if fulfilled
- method **required**
    - Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)
- params **optional**
    - JSON-RPC method call parameters

#### Code Sample
```javascript
let response = await aria2.call( { method: 'aria2.getVersion' } );
let version = response[0].result.version;
console.log(version) // the version of aria2c.exe;
```

## Getter & Setter
- [scheme](#scheme)
- [url](#url)
- [secret](#secret)
- [retry](#retry) *deprecated*
- [retries](#retries)
- [timeout](#timeout)
- [onopen](#onopen)
- [onclose](#onclose)
- [onmessage](#onmessage)

### scheme
```javascript
aria2.scheme = scheme;
console.log(aria2.scheme);
```
- Requires 0.2~
- schemes that decide the approach to JSON-RPC
- scheme
    - `http`, `https`, `ws`, and `wss`

### url
```javascript
aria2.url = url;
console.log(aria2.url);
```
- Requires 0.3~
- the url of JSON-RPC
    - `${hostname}:${port}/jsonrpc`
- hostname
    - `www.example.com`
- port
    - `6800` *default*
    - `443` for SSL

### secret
```javascript
aria2.secret = secret;
console.log(aria2.secret);
```
- Requires 0.3~
- the secret token `secret=your-secret-token` in JSON-RPC configuration
- secret
    - `string`

### retry
- `10`: Default
- Introduced in 0.7
- Use [retries](#retries) since 0.8

### retries
```javascript
aria2.retries = retries;
console.log(aria2.retries);
```
- Requires 0.8~
- maximum retries when connection to JSON-RPC is closed
- retries
    - `integer`
    - `10`: Default
    - `-1` or other negative numbers for unlimited retries
 
### timeout
```javascript
aria2.timeout = timeout;
console.log(aria2.timeout);
```
- Requires 0.7~
- time interval between retries
- timeout
    - `integer`
    - `10`: Default, equivalent to **10000** millisecond
    - It is recommended to use numbers larger than `3`

### onopen
```javascript
aria2.onopen = callback;
console.log(aria2.onopen);
```
- Requires 0.8~
- Function callback that runs when JSON-RPC is connected
- callback
    - `function`, (event) => void

### onclose
```javascript
aria2.onclose = callback;
console.log(aria2.onclose);
```
- Requires 0.5~
- Fcuntion callback that runs when JSON-RPC is closed
- callback
    - `function`, (event) => void

### onmessage
```javascript
aria2.onmessage = callback;
console.log(aria2.onmessage);
```
- Requires 0.2~
- Functon callback that runs when JSON-RPC sends messages
- callback
    - `function`, (response) => void

### Code Sample
```javascript
let jsonrpc = {};
let session = {};
let update;

let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");
aria2.retries = -1;
aria2.onopen = async () => {
    session.all = {};
    session.active = {};
    session.waiting = {};
    session.stopped = {};
    let [global, version, stats, active, waiting, stopped] = await aria2.call( {method: 'aria2.getGlobalOption'}, {method: 'aria2.getVersion'}, {method: 'aria2.getGlobalStat'}, {method: 'aria2.tellActive'}, {method: 'aria2.tellWaiting', params: [0, 999]}, {method: 'aria2.tellStopped', params: [0, 999]} );
    jsonrpc.options = global.result;
    jsonrpc.version = version.result;
    jsonrpc.stat = stats.result;
    active.result.forEach((result) => session.active[result.gid] = session.all[result.gid] = result);
    waiting.result.forEach((result) => session.waiting[result.gid] = session.all[result.gid] = result);
    stopped.result.forEach((result) => session.stopped[result.gid] = session.all[result.gid] = result);
    update = setInterval(aria2UpdateStats, 10000);
};
aria2.onclose = () => clearInterval(update);
aria2.onmessage = async (response) {
    let gid = response.params[0].gid;
    let res = await aria2.call({method: 'aria2.tellStatus', params: [gid]});
    let result = res[0].result;
    switch (response.method) {
        case 'aria2.onBtDownloadComplete':
            break;
        case 'aria2.onDownloadStart':
            console.log("The session #" + gid + " has started");
            session.active[gid] = result;
            if (session.waiting[gid]) {
                delete session.waiting[gid];
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
};
aria2.connect();

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
