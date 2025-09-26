# aria2.js

| Lastest | Extension | Web App |
| - | - | - |
| [aria2.js](https://jc3213.github.io/aria2.js/aria2.js) | [Download with Aria2](https://jc3213.github.io/download_with_aria2/) | [Task Manager](https://jc3213.github.io/aria2.js/app) |

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
let aria2 = new Aria2("http", "localhost:6800/jsonrpc", "mysecret");
let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");
```

```javascript
let aria2 = new Aria2(); // Requires 0.10.0~
aria2.scheme = 'wss';
aria2.url = 'example.com:433/jsonrpc';
aria2.secret = 'test-token';
```

## Properties
- [scheme](#scheme)
- [url](#url)
- [secret](#secret)
- [retries](#retries)
- [timeout](#timeout)

### scheme
```javascript
aria2.scheme = scheme;
```
- schemes that decide the approach to JSON-RPC
- scheme
    - `http`, `https`, `ws`, and `wss`

### url
- the url of JSON-RPC
```javascript
aria2.url = url;
```
- `${hostname}:${port}/jsonrpc`
    - hostname
        - `www.example.com
    - port
        - `6800` *default*
        - `443` for SSL

### secret
- the secret token `secret=your-secret-token` in JSON-RPC configuration
```javascript
aria2.secret = secret;
```
- secret
    - `string`

### retries
- maximum retries when connection to JSON-RPC is closed
```javascript
aria2.retries = retries;
```
- retries
    - `integer`
    - `10`: Default
    - `-1` or other negative numbers for unlimited retries
 
### timeout
- time interval between retries
```javascript
aria2.timeout = timeout;
```
- timeout
    - `integer`
    - `10`: Default, equivalent to **10000** millisecond
    - It is recommended to use numbers larger than `3`

## Method
- [connect](#connect)
- [disconnect](#disconnect)
- [call](#call)

### connect
- connect to `WebSocket` of aria2 JSON-RPC
```javascript
aria2.connect();
```

### disconnect
- disconnect from `WebSocket` of aria2 JSON-RPC
```javascript
aria2.disconnect();
```

### call
- send message to JSON-RPC
```javascript
let response = aria2.call( { method, params } );
let response = aria2.call( { method, params }, { method, params }, ..., { method, params } );
```
- use `WebSocket` or `POST` method based on [scheme](#scheme)
- response
    - `Promise` object, return an array that contains the response from JSON-RPC if fulfilled
- method **required**
    - Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)
- params *optional*
    - JSON-RPC method call parameters

#### Code Sample
```javascript
let [{ result }] = await aria2.call( { method: 'aria2.getVersion' } );
let { version } = result;
console.log(version) // the version of aria2c.exe;
```

## Events
- [onopen](#onopen)
- [onclose](#onclose)
- [onmessage](#onmessage)

### onopen
- callback function triggered when JSON-RPC connection is opened.
```javascript
aria2.onopen = function(event) { ... };
```
- callback
    - `function`, ( event: event[] ) => void

### onclose
- callback function triggered when JSON-RPC connection is closed.
```javascript
aria2.onclose = function(event) { ... };
```

### onmessage
- callback function triggered when a message is received from JSON-RPC.
```javascript
aria2.onmessage = function (response: object[]) { ... };
```

## Code Sample
```javascript
let jsonrpc = {};
let session = {};
let keeplive;

let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");
aria2.retries = -1;
aria2.onopen = async () => {
    session.all = {};
    session.active = {};
    session.waiting = {};
    session.stopped = {};
    let [
        { result: options }, { result: version }, { result: stats }, { result: active }, { result: waiting }, { result: stopped }
    ] = await aria2.call(
        { method: 'aria2.getGlobalOption' }, { method: 'aria2.getVersion' }, { method: 'aria2.getGlobalStat' }, { method: 'aria2.tellActive' }, { method: 'aria2.tellWaiting', params: [0, 999] }, { method: 'aria2.tellStopped', params: [0, 999] }
    );
    jsonrpc.options = options;
    jsonrpc.version = version;
    jsonrpc.stats = stats;
    active.forEach((a) => session.active[a.gid] = session.all[a.gid] = a);
    waiting.forEach((w) => session.waiting[w.gid] = session.all[w.gid] = w);
    stopped.forEach((s) => session.stopped[s.gid] = session.all[s.gid] = s);
    keeplive = setInterval(async () => {
        let [{ result: stats }, { result: active }] = await aria2.call({ method: 'aria2.getGlobalStat' }, { method: 'aria2.tellActive'} );
        jsonrpc.stats = stats;
        active.forEach((a) => session.active[a.gid] = session.all[a.gid] = a);
    }, 10000);
};
aria2.onclose = () => clearInterval(keeplive);
aria2.onmessage = async ({ method, params }) => {
    if (method === 'aria2.onBtDownloadComplete') {
        return;
    }
    let [{ gid }] = params;
    let [{ result }] = await aria2.call({ method: 'aria2.tellStatus', params: [gid] });
    switch (method) {
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
```
