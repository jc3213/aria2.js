| Library | SharedWorker | Browser Extension | Web UI & Electron App |
| - | - | - | - |
| [aria2.js](//jc3213.github.io/aria2.js/src/) | [shared.js](//jc3213.github.io/aria2.js/sharedworker/) | [Download with Aria2](https://jc3213.github.io/download_with_aria2/) | [Aria2 Task Manager](https://jc3213.github.io/aria2.app/) |

## Download SharedWorker

### Bash
```bash
curl -L -O https://jc3213.github.io/aria2.js/sharedworker/shared.js
curl -L -O https://jc3213.github.io/aria2.js/sharedworker/worker.js
```

### Powershell
```powershell
Invoke-WebRequest "https://jc3213.github.io/aria2.js/sharedworker/shared.js" -OutFile "shared.js"
Invoke-WebRequest "https://jc3213.github.io/aria2.js/sharedworker/worker.js" -OutFile "worker.js"
```

## Syntax

### HTML
```html
<script src="shared.js"></script>
```

### Javascript
```javascript
const worker = new SharedWorker('shared.js');
const port = worker.port;

port.start();

port.onmessage = function(event) {
    const message = event.data;
    const id = message.id;
    const type = message.type;
    const response = message.response;
    console.log(id, type, response);
};

port.postMessage({ id, type, payload });
```

### id
- `String` / `Number`
    - Unique ID for the message
    
### type
- `String`
    - connect
        - Set `WebSocket` url for aria2 JSON-RPC
        - Set secret token for aria2 JSON-RPC
        - Open `WebSocket` if not opened
        - Open new `WebSocket` if opened
        - ```payload = { jsonrpc, secret };```
        - [jsonrpc](#jsonrpc)
        - [secret](#secret)
    - disconnect
        - Close message port connected to `SharedWorker`
        - Remove message port if in the broadcast lists
        - Close `WebSocket` if all message ports are closed
    - subscribe
        - Add message port to the broadcast lists
    - unsubscribe
        - Remove message port from the broadcast lists
    - **websocket**
        - Handle notification events from `WebSocket` JSON-RPC
        - Only send messages to ports in the broadcast lists
    - call
        - Send request to aria2 JSON-RPC
        - ```payload = { method, params }```
        - [method](#method)
        - [params](#params)
    - multicall
        - Send multiple messages to aria2 JSON-RPC
        - ```payload = [ { methodName, params } ]```
        - [methodName](#method)
        - [params](#params)

### HTML
```html
<script src="shared.js"></script>
<script src="worker.js"></script>
```

### Javascript
```javascript
aria2.retries = 10; // Default
aria2.timeout = 10; // Default

aria2.onmessage = function(message) {
    console.log(message);
};

await aria2.connect(jsonrpc, secret, callback);
```

- [jsonrpc](#jsonrpc)
- [secret](#secret)
- callback
    - Function runs when failed to open `Websocket` before retries

```javascript
let response = await aria2.call(method, params);
```

- [method](#method)
- [params](#params)

```javascript
let response = await aria2.multicall([ { methodName, params } ]);
```

- [methodName](#method)
- [params](#params)

#### jsonrpc
- `String`
- The URL of JSON-RPC of aria2 download ultility

#### secret
- `String`
- The secret token `secret=your-secret-token` in JSON-RPC configuration

#### method
- `String`
- Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)

#### params
- `Array`
- JSON-RPC method call parameters
