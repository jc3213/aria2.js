var aria2Global = {};
var changes = {};
var config = {};

var [,,, commitBtn, enterBtn, proxyBtn] = document.querySelectorAll('button[id]');
var [setting, ...options] = document.querySelectorAll('#setting, #setting [name]');
var [adduri, ...download]= document.querySelectorAll('#adduri, #adduri [name]');
var [entry, uploader] = adduri.querySelectorAll('#entry, #uploader');

downBtn.addEventListener('click', async (event) => {
    manager.toggle('adduri');
    manager.remove('setting')
});

optionsBtn.addEventListener('click', (event) => {
    manager.toggle('setting');
    manager.remove('adduri');
});

commitBtn.addEventListener('click', (event) => {
    options.forEach((entry) => { localStorage[entry.name] = config[entry.name] ?? entry.dataset.value; });
    if ('interval' in changes) {
        clearInterval(aria2Interval);
        aria2Period = config.interval * 1000;
        aria2Interval = setInterval(aria2ClientUpdate, aria2Period);
    }
    if ('proxy' in changes) {
        aria2Proxy = config.proxy;
    }
    if ('scheme' in changes) {
        aria2RPC.scheme = config.scheme;
    }
    if ('secret' in changes) {
        aria2RPC.secret = config.scheme;
    }
    if ('jsonrpc' in changes) {
        aria2RPC.url = config.jsonrpc;
    }
    changes = {};
});

enterBtn.addEventListener('click', (event) => {
    var sessions = [];
    var urls = entry.value.match(/(https?:\/\/|ftp:\/\/|magnet:\?)[^\s\n]+/g);
    if (urls) {
        urls.forEach((url) => sessions.push({url, options: aria2Global}));
        aria2RPC.call(...sessions);
    }
    entry.value = '';
    manager.remove('adduri');
});

proxyBtn.addEventListener('click', (event) => {
    event.target.previousElementSibling.value = localStorage.aria2Proxy || '';
});

uploader.addEventListener('change', async (event) => {
    var sessions = [];
    await Promise.all([...event.target.files].map(async (file) => {
        var type = file.name.slice(file.name.lastIndexOf('.') + 1);
        var b64encode = await promiseFileReader(file);
        var download = type === 'torrent' ? {method: 'aria2.addTorrent', params: [b64encode, [], aria2Global]} : {method: 'aria2.addMetalink', params: [b64encode, aria2Global]};
        sessions.push(download);
    }));
    await aria2RPC.call(...sessions);
    event.target.value = '';
    manager.remove('adduri');
});

function promiseFileReader(file) {
    return new Promise((resolve) => {
        var reader = new FileReader();
        reader.onload = (event) => {
            var base64 = reader.result.slice(reader.result.indexOf(',') + 1);
            resolve(base64);
        };
        reader.readAsDataURL(file);
    });
}

NodeList.prototype.disposition = function (json) {
    return ParseOptions(this, json);
}

setting.addEventListener('change', (event) => {
    config[event.target.name] = changes[event.target.name] = event.target.value;
});

options.forEach((entry) => {
    config[entry.name] = entry.value = localStorage[entry.name] ?? entry.dataset.value;
});

function ParseOptions(nodes, json) {
    var result = {};
    nodes.forEach((node) => {
        var value = json[node.name];
        if (value) {
            node.value = result[node.name] = value;
        }
    });
    return result;
}

(async function () {
    aria2Proxy = config.proxy;
    aria2Delay = config.interval * 1000;
    aria2RPC = new Aria2(config.scheme, config.jsonrpc, config.secret);
    aria2RPC.onopen = aria2ClientOpened;
    aria2RPC.onclose = aria2ClientClosed;
    aria2RPC.onmessage = aria2ClientMessage;
    var [global, version] = await aria2RPC.call({method: 'aria2.getGlobalOption'}, {method: 'aria2.getVersion'});
    var options = global.result;
    options['min-split-size'] = getFileSize(options['min-split-size']);
    options['max-download-limit'] = getFileSize(options['max-download-limit']);
    options['max-upload-limit'] = getFileSize(options['max-upload-limit']);
    aria2Global = ParseOptions(download, options);
    document.querySelector('#aria2_ver').textContent = version.result.version;
})();
