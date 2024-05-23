class Aria2XMLRequest {
    constructor (url, secret) {
        this.jsonrpc = url;
        this.secret = secret;
        this.params = secret ? ['token:' + secret] : [];
    }
    get (...messages) {
        return fetch(this.jsonrpc + '?params=' + btoa(unescape(encodeURIComponent(this.json(messages))))).then(this.result);
    }
    post (...messages) {
        return fetch(this.jsonrpc, {method: 'POST', body: this.json(messages)}).then(this.result);
    }
    result (response) {
        if (response.ok) { return response.json(); } throw new Error(response.statusText);
    }
    json (array) {
        return JSON.stringify(array.map( ({method, params = []}) => ({ id: '', jsonrpc: '2.0', method, params: [...this.params, ...params] }) ));
    }
}
