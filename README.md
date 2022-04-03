## How to Use
### HTML
```HTML
<script src="https://raw.githubusercontent.com/jc3213/aria2.js/main/aria2_0.3.10.js"
        integrity="sha256-BMZovADoJ6OKcNrw1YxIG4iKLGT6tSEYinNfA+aN0qg=" crossorigin="anonymous"></script>
```
### TamperMonkey
```javascript
// @require https://raw.githubusercontent.com/jc3213/aria2.js/main/aria2_0.3.10.js#sha256-BMZovADoJ6OKcNrw1YxIG4iKLGT6tSEYinNfA+aN0qg=
```
## Syntax
```javascript
const aria2 = new Aria2(jsonrpc, secret);
```
### `jsonrpc` `*required`
Address of aria2 JSON-RPC
### `secret` `Optional`
Secret token of aria2 JSON-RPC
## Method
```javascript
const result = aria2.message(method, params);
```
### `method` `*required`
Read [RPC method calls](https://aria2.github.io/manual/en/html/aria2c.html#methods)
### `params` `Optional`
An array contains RPC method call parameters
### `result`
Promise object, returns an `object` if fulfilled
