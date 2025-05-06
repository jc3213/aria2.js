class Aria2XMLRequest {
    constructor (...args) {
        let path = args.join('#').match(/^(https?)(?:#|:\/\/)([^#]+)#?(.*)$/);
        if (!path) { throw new Error(`Unsupported parameters: "${args.join('", "')}"`); }
        this.method = 'post';
        this.secret = path[3];
        this.url = `${path[1]}://${path[2]}`;
    }
    version = '1.0';
    #status;
    get status () {
        return this.#status;
    }
    #method;
    set method (method) {
        if (!/^(post|get)$/i.test(method)) { throw new Error(`Unsupported method: "${method}"`); }
        this.call = method.toLowerCase() === 'post' ? this.#post : this.#get;
        this.#method = method;
    }
    get method () {
        return this.#method;
    }
    #url;
    set url (url) {
        if (!/^https?:\/\/[^/]+\/\w+$/.test(url)) { throw new Error (`Unsupported url: "${url}"`); }
        this.#url = url;
        this.#post({method: 'aria2.getGlobalStat'}, {method: 'aria2.getVersion'}, {method: 'aria2.getGlobalOption'}, {method: 'aria2.tellActive'}, {method: 'aria2.tellWaiting', params: [0, 999]}, {method: 'aria2.tellStopped', params: [0, 999]})
        .then(([stats, version, options, active, waiting, stopped]) => { this.#status = {stats, version, options, active, waiting, stopped}; })
        .catch((error) => { this.#status = null; });
    }
    get url () {
        return this.#url;
    }
    #secret;
    set secret (secret) {
        this.#secret = `token:${secret}`;
    }
    get secret () {
        return this.#secret.slice(6);
    }
    #get (...args) {
        return fetch(`${this.#url}?params=${btoa(unescape(encodeURIComponent(this.#json(args))))}`).then(this.#then);
    }
    #post (...args) {
        return fetch(this.#url, {method: 'POST', body: this.#json(args)}).then(this.#then);
    }
    #then (response) {
        if (response.ok) { return response.json(); } throw new Error(response.statusText);
    }
    #json (args) {
        let json = args.map( ({ method, params = [] }) => ({ id: '', jsonrpc: '2.0', method, params: [this.#secret, ...params] }) );
        return JSON.stringify(json);
    }
}
