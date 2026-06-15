# aria2.js/src

| Class Type | SharedWorker Type | Extension | Web App |
| - | - | - | - |
| [aria2.js](//jc3213.github.io/aria2.js/src/) | | [aria2.js](//jc3213.github.io/aria2.js/sharedworker/) | [Download with Aria2](https://jc3213.github.io/download_with_aria2/) | [Task Manager](https://jc3213.github.io/aria2.app/) |

### HTML
```HTML
<script src="https://jc3213.github.io/aria2.js/src/aria2.js"></script>
```

```HTML
<script src="https://jc3213.github.io/aria2.js/src/aria2.min.js"></script>
```

### TamperMonkey
```javascript
// @require https://jc3213.github.io/aria2.js/aria2.js
```

```javascript
// @require https://jc3213.github.io/aria2.js/aria2.min.js
```

## Syntax
```javascript
const aria2 = new Aria2("http://localhost:6800/jsonrpc", "mysecret");
```

```javascript
const aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");
```

```javascript
const aria2 = new Aria2();
aria2.url = 'wss://example.com:433/jsonrpc';
aria2.secret = 'mysecret';
```

## Properties
- [url](#url)
- [secret](#secret)
- [retries](#retries)
- [timeout](#timeout)

### url
- `String`
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
- `String`
- the secret token `secret=your-secret-token` in JSON-RPC configuration

```javascript
aria2.secret = secret;
```

### retries
- `Number`
- maximum retries when connection to JSON-RPC is closed
```javascript
aria2.retries = retries;
```
- `Integer`
- `10`: Default
- `-1` or other negative numbers for unlimited retries
 
### timeout
- `Number`
- time interval between retries
```javascript
aria2.timeout = timeout;
```
- `Integer`
- `10`: Default, equivalent to **10000** millisecond
- It is recommended to use numbers larger than `3`

## Method
- [connect](#connect)
- [disconnect](#disconnect)
- [call](#call)
- [multicall](#multicall)

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
const response = aria2.call(method, params);
```
```javascript
const response = await aria2.call('aria2.tellActive');
console.log(response.result) // All downloading sessions;
```
- response
    - `Promise` object, return response from JSON-RPC if fulfilled
- [method](#method-1) **required**
- [params](#params) *optional*

### multicall
- send batch of messages to JSON-RPC
```javascript
const response = aria2.multicall([ { methodName, params }, ... ]);
```
```javascript
const response = await aria2.multicall([ { methodName: 'aria2.getGlobalOption' }, { methodName: 'aria2.getVersion' } ]);
const result = response.result;
const globalOption = result[0][0];
const version = result[1][0];
console.log(globalOption, version); // The options, version and enabled features of JSON-RPC;
```
- response
    - `Promise` object, return an array of resposne from JSON-RPC if fulfilled
- [methodName](#method-1) **required**
- [params](#params) *optional*

#### method
- `String`
- Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)

#### params
- `Array`
- JSON-RPC method call parameters

## Events
- [onopen](#onopen)
- [onclose](#onclose)
- [onmessage](#onmessage)

### onopen
- `Function`
- Triggered when `WebSocket` connection to JSON-RPC is opened.
```javascript
aria2.onopen = function(event) { ... };
```

### onclose
- `Function`
- Triggered when `WebSocket` connection to JSON-RPC is closed.
```javascript
aria2.onclose = function(event) { ... };
```

### onmessage
- `Function`
- Triggered when recive messages from JSON-RPC via `WebSocket`.
```javascript
aria2.onmessage = function (response: object[]) { ... };
```

## Code Sample
```javascript
let keeplive;

const jsonrpc = {};

const session = {};

const waiting = new Set([ 'waiting', 'paused' ]);

const dispatch = {
    'aria2.onDownloadStart'(gid, result) {
        console.log("The session #" + gid + " has started");
        session.active[gid] = result;

        if (session.waiting[gid]) {
            delete session.waiting[gid];
        }
    },
    'aria2.onDownloadComplete'(gid, result) {
        console.log("The session #" + gid + " has completed");
        dispatch.default(gid, result);
    },
    default(gid, result) {
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

const aria2 = new Aria2("http://localhost:6800/jsonrpc#mysecret");

aria2.retries = -1;

aria2.onopen = async () => {
    session.all = {};
    session.active = {};
    session.waiting = {};
    session.stopped = {};

    const response = await aria2.multicall([
        { methodName: 'aria2.getGlobalOption' },
        { methodName: 'aria2.getVersion' },
        { methodName: 'aria2.getGlobalStat' },
        { methodName: 'aria2.tellActive' },
        { methodName: 'aria2.tellWaiting', params: [0, 999] },
        { methodName: 'aria2.tellStopped', params: [0, 999] }
    ]);
    const result = response.result;

    jsonrpc.options = result[0][0];
    jsonrpc.version = result[1][0];
    jsonrpc.stats = result[2][0];;

    const active = result[3][0];
    const waiting = result[4][0];
    const stopped = result[5][0];

    for (let i = 0, l = active.length; i < l; i++) {
        const a = active[i];
        session.active[a.gid] = session.all[a.gid] = a;
    }
    for (let i = 0, l = waiting.length; i < l; i++) {
        const w = waiting[i];
        session.waiting[w.gid] = session.all[w.gid] = w;
    }
    for (let i = 0, l = stopped.length; i < l; i++) {
        const s = stopped[i];
        session.stopped[s.gid] = session.all[s.gid] = s;
    }

    keeplive = setInterval(async () => {
        const response = await aria2.multicall([
            { methodName: 'aria2.getGlobalStat' },
            { methodName: 'aria2.tellActive'}
        ]);
        const result = response.result;

        jsonrpc.stats = result[0][0];

        const active = result[1][0];

        for (let i = 0, l = active.length; i < l; i++) {
            const a = active[i];
            session.active[a.gid] = session.all[a.gid] = a;
        }
    }, 10000);
};

aria2.onclose = () => clearInterval(keeplive);

aria2.onmessage = async (message) => {
    const method = message.method;

    if (method === 'aria2.onBtDownloadComplete') {
        return;
    }

    const gid = message.params[0].gid;

    const response = await aria2.call('aria2.tellStatus', [gid]);

    const handler = dispatch[method] || dispatch.default;
    handler(gid, response.result);
};

aria2.connect();
```
