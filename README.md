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
let aria2 = new Aria2("http", "localhost:6800/jsonrpc", "mysecret"); // Requires 0.2.0~
let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret"); // Requires 0.4.0~
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
- require `0.2~`
- schemes that decide the approach to JSON-RPC
- scheme
    - `http`, `https`, `ws`, and `wss`

### url
```javascript
aria2.url = url;
```
- require `0.3~`
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
```
- require `0.3~`
- the secret token `secret=your-secret-token` in JSON-RPC configuration
- secret
    - `string`

### retries
```javascript
aria2.retries = retries;
```
- require `0.8~`
- maximum retries when connection to JSON-RPC is closed
- retries
    - `integer`
    - `10`: Default
    - `-1` or other negative numbers for unlimited retries
 
### timeout
```javascript
aria2.timeout = timeout;
```
- require `0.7~`
- time interval between retries
- timeout
    - `integer`
    - `10`: Default, equivalent to **10000** millisecond
    - It is recommended to use numbers larger than `3`

## Method
- [connect](#connect)
- [disconnect](#disconnect)
- [call](#call)

### connect
```javascript
aria2.connect();
```
- require `0.2~`
- connect to `WebSocket` of aria2 JSON-RPC
- *0.2*~*0.8*
    - Run when `Aria` instance is initialized, or [url](#url) is changed
- *0.8*~
    - Run at yourself

### disconnect
```javascript
aria2.disconnect();
```
- require `0.2~`
- disconnect from `WebSocket` of aria2 JSON-RPC
- *0.2*~*0.8*
    - Run when `Aria` instance is initialized, or [url](#url) is changed
- *0.8*~
    - Run at yourself

### call
```javascript
let response = aria2.call( { method, params } );
let response = aria2.call( { method, params }, { method, params }, ..., { method, params } );
```
- use `WebSocket` or `HTTP Post` method based on [scheme](#scheme)
- response
    - `Promise` object, return an array that contains the response from JSON-RPC if fulfilled
- method **required**
    - Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)
- params *optional*
    - JSON-RPC method call parameters

#### Code Sample
```javascript
let response = await aria2.call( { method: 'aria2.getVersion' } );
let version = response[0].result.version;
console.log(version) // the version of aria2c.exe;
```

## Events
- [onopen](#onopen)
- [onclose](#onclose)
- [onmessage](#onmessage)

### onopen
```javascript
aria2.onopen = callback: function;
```
- require `0.8~`
- function callback that fires when JSON-RPC is connected
- callback
    - `function`, ( event: event[] ) => void

### onclose
```javascript
aria2.onclose = callback: function;
```
- require `0.5~`
- function callback that fires when JSON-RPC is closed
- callback
    - `function`, ( event: event[] ) => void

### onmessage
```javascript
aria2.onmessage = callback: function;
```
- require `0.2~`
- function callback that fires when recieve message from JSON-RPC
- callback
    - `function`, ( response: object ) => void

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
