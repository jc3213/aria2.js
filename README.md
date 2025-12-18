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
```

```javascript
let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");
```

```javascript
let aria2 = new Aria2();
aria2.url = 'wss://example.com:433/jsonrpc';
aria2.secret = 'mysecret';
```

## Properties
- [url](#url)
- [secret](#secret)
- [retries](#retries)
- [timeout](#timeout)

### url
- the URL of JSON-RPC
```javascript
aria2.url = url;
```
- `${scheme}://${hostname}:${port}/jsonrpc`
    - scheme
        - `http`
        - `https`
        - `ws`
        - `wss`
    - hostname
        - `www.example.com`
    - port
        - `6800` *default*
        - `443`  *ssl*

### secret
- the secret token `secret=your-secret-token` in JSON-RPC configuration
```javascript
aria2.secret = secret;
```
- `string`

### retries
- maximum retries when connection to JSON-RPC is closed
```javascript
aria2.retries = retries;
```
- `integer`
- `10`: Default
- `-1` or other negative numbers for unlimited retries
 
### timeout
- time interval between retries
```javascript
aria2.timeout = timeout;
```
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
let response = aria2.call([ { method, params }, { method, params }, ..., { method, params } ]);
```
- use `WebSocket` or `POST` method based on [scheme](#scheme)
- response
    - `Promise` object, return an array that contains the response from JSON-RPC if fulfilled
- method **required**
    - Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)
- params *optional*
    - JSON-RPC method call parameters

#### Call Sample
```javascript
let { result } = await aria2.call( { method: 'aria2.tellActive' } );
console.log(result) // All downloading sessions;

let { result } = await aria2.call([ { method: 'aria2.getGlobalOption' }, { method: 'aria2.getVersion' } ]);
let [ [globalOption], [version] ] = result;
console.log(globalOption, version); // The options, version and enabled features of JSON-RPC;
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

let waiting = new Set([ 'waiting', 'paused' ]);
let dispatch = {
    'aria2.onDownloadStart' (gid, result) {
        console.log("The session #" + gid + " has started");
        session.active[gid] = result;
        if (session.waiting[gid]) {
            delete session.waiting[gid];
        }
    },
    'aria2.onDownloadComplete' (gid, result) {
        console.log("The session #" + gid + " has completed");
        dispatch.default(gid, result);
    },
    default (gid, result) {
        if (session.active[gid]) {
            delete session.active[gid];
            if (waiting.has(result.status)) {
                session.waiting[gid] = result;
            } else {
                session.stopped[gid] = result;
            }
        }
    }
};

let aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");
aria2.retries = -1;

aria2.onopen = async () => {
    session.all = {};
    session.active = {};
    session.waiting = {};
    session.stopped = {};

    let { result: [
        [options], [version], [stats], [active], [waiting], [stopped]
    ] } = await aria2.call([
        { method: 'aria2.getGlobalOption' },
        { method: 'aria2.getVersion' },
        { method: 'aria2.getGlobalStat' },
        { method: 'aria2.tellActive' },
        { method: 'aria2.tellWaiting', params: [0, 999] },
        { method: 'aria2.tellStopped', params: [0, 999] }
    ]);

    jsonrpc.options = options;
    jsonrpc.version = version;
    jsonrpc.stats = stats;

    for (let a of active) {
        session.active[a.gid] = session.all[a.gid] = a;
    }
    for (let w of waiting) {
        session.waiting[w.gid] = session.all[w.gid] = w;
    }
    for (let s of stopped) {
        session.stopped[s.gid] = session.all[s.gid] = s;
    }

    keeplive = setInterval(async () => {
        let { result: [
            [stats], [active]
         ] } = await aria2.call([
            { method: 'aria2.getGlobalStat' },
            { method: 'aria2.tellActive'}
        ]);
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
    let { result } = await aria2.call({ method: 'aria2.tellStatus', params: [gid] });

    (dispatch[method] ?? dispatch.default)(gid, result);
};

aria2.connect();
```
