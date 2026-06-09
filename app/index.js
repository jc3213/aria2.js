const hotkeyMap = document.querySelectorAll('[hotkey]')
const hotkeyCombo = {};

for (let i = 0, l = hotkeyMap.length; i < l; i++) {
    let el = hotkeyMap[i];
    let keys = el.getAttribute('hotkey').toLowerCase().split('\n');
    for (let j = 0, m = keys.length; j < m; j++) {
        let k = keys[j].trim();
        if (k) {
            hotkeyCombo[k] = el;
        }
    }
}

document.addEventListener('keydown', (event) => {
    let keys = [];
    if (event.ctrlKey) {
        keys.push('ctrl');
    }
    if (event.altKey) {
        keys.push('alt');
    }
    if (event.shiftKey) {
        keys.push('shift');
    }
    keys.push(event.key.toLowerCase());
    let combo = keys.join('+');
    let hotkey = hotkeyCombo[combo];
    if (hotkey) {
        event.preventDefault();
        hotkey.click();
    }
});

const optionsPane = document.createElement('div');
optionsPane.id = 'setting';
optionsPane.className = 'config hidden';
optionsPane.innerHTML = `
<div>
    <h4 i18n="options_jsonrpc">JSON-RPC Server</h4>
    <div class="flex">
        <input name="url" type="url">
        <input name="secret" type="password" placeholder="$$secret$$">
        <button id="json-rpc" disabled>⚙️</button>
    </div>
 </div>
<div class="cfg-item">
    <h4 i18n="options_jsonrpc_retries">Max Retries</h4>
    <input name="retries" type="number" min="-1" step="1">
</div>
<div class="cfg-item">
    <h4 i18n="options_jsonrpc_timeout">Retry Interval</h4>
    <div>
        <input name="timeout" type="number" min="5" max="30" step="1">
        <span i18n="time_second_full"></span>
    </div>
</div>
<div class="cfg-item">
    <h4 i18n="options_manager_interval">Update Interval</h4>
    <div>
        <input name="interval" type="number" min="1" max="60" step="1">
        <span i18n="time_second_full"></span>
    </div>
</div>
<div class="cfg-item">
    <h4 i18n="task_proxy">Proxy Server</h4>
    <input name="proxy" type="url" placeholder="http://127.0.0.1:1230/">
</div>
`;

const downPane = document.createElement('div');
downPane.id = 'adduri';
downPane.className = 'config hidden';
downPane.innerHTML = `
<div i18n-tips="tips_task_referer">
    <h4 i18n="task_referer">Referer</h4>
    <div class="flex">
        <input type="text">
        <button id="down-file" i18n="task_base64">Upload</button>
        <button id="down-url" i18n="task_submit">Submit</button>
        <input type="file" accept=".torrent, .metalink, .meta4" multiple class="hidden">
    </div>
</div>
<div i18n-tips="tips_task_entry">
    <h4 i18n="task_entry">Download Urls</h4>
    <textarea rows="3"></textarea>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_down_dir">
    <h4 i18n="aria2_down_dir">Download Folder</h4>
    <input name="dir" type="text">
</div>
<div class="cfg-item" i18n-tips="tips_task_proxy">
    <h4 i18n="task_proxy">Proxy Server</h4>
    <div class="flexmenu">
        <input name="all-proxy" type="url">
        <button id="all-proxy" i18n-tips="tips_proxy_server">⚡️</button>
    </div>
</div>
<div class="cfg-item" i18n-tips="aria2_http_split">
    <h4 i18n="aria2_http_split">Download Sections</h4>
    <input name="split" type="number">
</div>
<div class="cfg-item" i18n-tips="tips_aria2_http_connection">
    <h4 i18n="aria2_http_size">Section Size</h4>
    <div>
        <input name="min-split-size" type="text">
        <span class="float">B</span>
    </div>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_http_connection">
    <h4 i18n="aria2_http_connection">Max Connections per Server</h4>
    <input name="max-connection-per-server" type="number">
</div>
<div class="cfg-item" i18n-tips="tips_task_download">
    <h4 i18n="task_download">Max Download Speed</h4>
    <div>
        <input name="max-download-limit" type="text" value="0">
        <span class="float">B/s</span>
    </div>
</div>
`;

const jsonrpcPane = document.createElement('div');
jsonrpcPane.id = 'jsonrpc';
jsonrpcPane.className = 'config hidden';
jsonrpcPane.innerHTML = `
<h1 i18n="aria2_options"></h1>
<div class="cfg-item" i18n-tips="tips_aria2_down_dir">
    <h4 i18n="aria2_down_dir"></h4>
    <input name="dir" type="text">
    <i class="sample" title="&quot;C:\\Aria2\\Download&quot; (Windows)&#10;&#10;&quot;/home/aria2/download&quot; (Linux)"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_file_alloc">
    <h4 i18n="aria2_file_alloc"></h4>
    <select name="file-allocation">
        <option value="none" i18n="options_disabled"></option>
        <option value="prealloc" i18n="aria2_alloc_pre"></option>
        <option value="falloc" i18n="aria2_alloc_fast"></option>
        <option value="trunc" i18n="aria2_alloc_trunc"></option>
    </select>
    <i class="default" i18n="aria2_alloc_pre"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_disk_cache">
    <h4 i18n="aria2_disk_cache"></h4>
    <div>
        <input name="disk-cache" type="text">
        <span>B</span>
    </div>
    <i class="default">16M</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_overwrite">
    <h4 i18n="aria2_overwrite"></h4>
    <select name="allow-overwrite">
        <option value="true" i18n="aria2_true"></option>
        <option value="false" i18n="aria2_false"></option>
    </select>
    <i class="default" i18n="aria2_false"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_max_download">
    <h4 i18n="aria2_max_download"></h4>
    <div>
        <input name="max-overall-download-limit" type="text">
        <span>B/s</span>
    </div>
    <i class="disabled">0</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_max_upload">
    <h4 i18n="aria2_max_upload"></h4>
    <div>
        <input name="max-overall-upload-limit" type="text">
        <span>B/s</span>
    </div>
    <i class="disabled">0</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_max_concurrent">
    <h4 i18n="aria2_max_concurrent"></h4>
    <input name="max-concurrent-downloads" type="number">
    <i class="default">5</i>
</div>
<h1>HTTP/FTP</h1>
<div class="cfg-item" i18n-tips="tips_aria2_http_retry">
    <h4 i18n="aria2_http_retry"></h4>
    <input name="max-tries" type="number">
    <i class="default">5</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_http_wait">
    <h4 i18n="aria2_http_wait"></h4>
    <div>
        <input name="retry-wait" type="number">
        <span i18n="time_second_full"></span>
    </div>
    <i class="default">0</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_http_split">
    <h4 i18n="aria2_http_split"></h4>
    <input name="split" type="number">
    <i class="default">5</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_http_size">
    <h4 i18n="aria2_http_size"></h4>
    <div>
        <input name="min-split-size" type="text">
        <span>B</span>
    </div>
    <i class="default">20M</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_http_connection">
    <h4 i18n="aria2_http_connection"></h4>
    <input name="max-connection-per-server" type="number">
    <i class="default">1</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_http_ua">
    <h4 i18n="aria2_http_ua"></h4>
    <input name="user-agent" type="text">
    <i id="useragent" class="default"></i>
</div>
<h1>BitTorrent</h1>
<div class="cfg-item" i18n-tips="tips_aria2_bt_port">
    <h4 i18n="aria2_bt_port"></h4>
    <input name="listen-port" type="text">
    <i class="default">6881-6999</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_peers">
    <h4 i18n="aria2_bt_peers"></h4>
    <input name="bt-max-peers" type="number">
    <i class="default">55</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_dht">
    <h4 i18n="aria2_bt_dht"></h4>
    <select name="enable-dht">
        <option value="true" i18n="aria2_true"></option>
        <option value="false" i18n="aria2_false"></option>
    </select>
    <i class="default" i18n="aria2_true"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_dht6">
    <h4 i18n="aria2_bt_dht6"></h4>
    <select name="enable-dht6">
        <option value="true" i18n="aria2_true"></option>
        <option value="false" i18n="aria2_false"></option>
    </select>
    <i class="default" i18n="aria2_false"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_follow">
    <h4 i18n="aria2_bt_follow"></h4>
    <select name="follow-torrent">
        <option value="true" i18n="aria2_true"></option>
        <option value="false" i18n="aria2_false"></option>
    </select>
    <i class="default" i18n="aria2_true"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_remove">
    <h4 i18n="aria2_bt_remove"></h4>
    <select name="bt-remove-unselected-file">
        <option value="true" i18n="aria2_true"></option>
        <option value="false" i18n="aria2_false"></option>
    </select>
    <i class="default" i18n="aria2_false"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_ratio">
    <h4 i18n="aria2_bt_ratio"></h4>
    <input name="seed-ratio" type="number" min="0" step="0.1">
    <i class="default">1.0</i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_seed">
    <h4 i18n="aria2_bt_seed"></h4>
    <div>
        <input name="seed-time" type="number">
        <span i18n="time_minute_full"></span>
    </div>
    <i class="disabled"></i>
</div>
`;

const extraCss = document.createElement('style');
extraCss.textContent = `
textarea {
    padding: 3px;
    border-width: 1px;
    border-style: inset;
    overflow-y: auto;
    overflow-x: hidden;
    resize: none;
    width: calc(100% - 12px);
}

#adduri, #setting, #jsonrpc {
    border-width: 1px;
    border-style: solid;
    grid-area: 1 / 2 / 2 / 3;
    height: fit-content;
    padding: 8px;
    position: absolute;
    width: 600px;
    z-index: 9;
}

#adduri .flex > button, #setting .flex > button {
    height: 25px;
    padding: 0px 5px;
}

#setting input[name="url"] {
    width: 200%;
}

#jsonrpc > h1:first-of-type {
    margin-top: 0px;
}
`;

const i18nCss = document.createElement('style');

document.body.append(optionsPane, downPane, jsonrpcPane, extraCss, i18nCss);

let aria2Config = {};
let aria2Storage = new Map();

let menuTree = menuPane.children;
let downBtn = menuTree[0];
let purgeBtn = menuTree[1];
let optionsBtn = menuTree[2];
let optionsEntries = optionsPane.querySelectorAll('[name]');
let remoteBtn = optionsPane.querySelector('button');
let downEntry = downPane.querySelector('textarea');
let metaFiles = downPane.querySelector('input[type="file"]');
let remoteEntries = [ ...jsonrpcPane.querySelectorAll('[name]'), ...downPane.querySelectorAll('[name]') ];

taskFilters(
    JSON.parse(localStorage.getItem('queue')) || [],
    (array) => localStorage.setItem('queue', JSON.stringify(array))
);

menuEvents['popup_newdld'] = function() {
    downBtn.classList.toggle('checked');
    downPane.classList.toggle('hidden');
    optionsBtn.classList.remove('checked');
    optionsPane.classList.add('hidden');
    jsonrpcPane.classList.add('hidden');
};

menuEvents['popup_options'] = function() {
    optionsBtn.classList.toggle('checked');
    optionsPane.classList.toggle('hidden');
    downBtn.classList.remove('checked');
    downPane.classList.add('hidden');
    jsonrpcPane.classList.add('hidden');
};

i18nEntry.addEventListener('change', (event) => {
    let locale = i18nEntry.value;
    localStorage.setItem('locale', locale);
    i18nUserInterface(locale);
});

let updateStorage;

optionsPane.addEventListener('change', (event) => {
    let entry= event.target;
    let name = entry.name;
    let value = entry.value;
    if (entry.type === 'number') {
        value = value | 0;
    }
    aria2Storage.set(name, value);
    localStorage.setItem(name, value);
    clearTimeout(updateStorage);
    updateStorage = setTimeout(() => {
        aria2RPC.disconnect();
        optionsDispatch();
    }, 2500);
});

remoteBtn.addEventListener('click', (event) => {
    jsonrpcPane.classList.remove('hidden');
});

jsonrpcPane.addEventListener('change', (event) => {
    let entry = event.target;
    let name = entry.name;
    aria2Config[name] = entry.value;
});

function downloadURLs() {
    let urls = downEntry.value.match(/(https?:\/\/|ftp:\/\/|magnet:\?)[^\s\n]+/g);
    if (!urls) {
        downBtn.click();
        return;
    }
    let options = { ...aria2Config };
    let out = options.out;
    options.out = urls.length !== 1 || !out ? null : out.replace(/[\\/:*?"<>|]/g, '_');
    let params = [];
    for (let i = 0, l = urls.length; i < l; i++) {
        params.push({ method: 'aria2.addUri', params: [ [urls[i] ], options] });
    }
    aria2RPC.multicall(params).then(() => {
        downBtn.click();
    });
}

async function downloadFiles(files) {
    let options = { ...aria2Config };
    let datas = [];
    options['out'] = options['referer'] = options['user-agent'] = null;
    for (let i = 0, l = files.length; i < l; i++) {
        let file = files[i];
        let name = file.name;
        let method;
        let params = [options];
        if (name.endsWith('.torrent')) {
            method = 'aria2.addTorrent';
            params.unshift([]);
        } else if (name.endsWith('.meta4') || name.endsWith('.metalink')) {
            method = 'aria2.addMetalink';
        } else {
            continue;
        }
        datas.push(new Promise((resolve) => {
            let reader = new FileReader();
            reader.onload = (event) => {
                let result = reader.reader;
                params.unshift(result.substring(result.indexOf(',') + 1));
                resolve({ method: params });
            };
            reader.readAsDataURL(file);
        }));
    }
    let params = await Promise.all(datas);
    aria2RPC.multicall(params).then(() => {
        downBtn.click();
    });
}

const downEvents = {
    'down-url': downloadURLs,
    'down-file': () => metaFiles.click(),
    'all-proxy': (event) => event.target.previousElementSibling.value = aria2Storage.get('proxy')
};

downPane.addEventListener('click', (event) => {
    let entry = event.target;
    let id = entry.id;
    if (id || entry.localName === 'button') {
        downEvents[id](event);
    }
});

downPane.addEventListener('change', (event) => {
    let entry = event.target;
    let name = entry.name;
    if (name) {
        aria2Config[name] = entry.value;
    } else if (files) {
        downloadFiles(entry.files);
    }
});

downPane.addEventListener('dragover', (event) => {
    event.preventDefault();
});

downPane.addEventListener('drop', (event) => {
    event.preventDefault();
    downloadFiles(event.dataTransfer.files);
});

const optionsDefault = {
    url: 'ws://localhost:6800/jsonrpc',
    secret: '',
    retries: 10,
    timeout: 10,
    interval: 15,
    proxy: '',
    locale: 'en-US'
};

function getOptionValue(key) {
    let value = localStorage.getItem(key);
    if (value === null) {
        return optionsDefault[key];
    }
    return value;
}

function optionsDispatch() {
    aria2RPC.url = aria2Storage.get('url');
    aria2RPC.secret = aria2Storage.get('secret');
    aria2RPC.retries = aria2Storage.get('retries');
    aria2RPC.timeout = aria2Storage.get('timeout');
    aria2Proxy = aria2Storage.get('proxy');
    aria2Delay = aria2Storage.get('interval') * 1000;
    aria2RPC.connect();
}

const i18nLang = new Set(['en-US', 'zh-CN']);

async function i18nUserInterface(lang) {
    const i18nText = document.querySelectorAll('[i18n]');
    const i18nTips = document.querySelectorAll('[i18n-tips]');

    const i18nFile = i18nLang.has(lang) ? 'i18n/' + lang + '.json' : 'i18n/en-us.json';
    const i18nJSON = await fetch(i18nFile).then((response) => response.json());

    for (let i = 0, l = i18nText.length; i < l; i++) {
        let el = i18nText[i];
        let key = el.getAttribute('i18n');
        let i18n = i18nJSON[key];
        if (key) {
            el.textContent = i18n;
        }
    }

    for (let i = 0, l = i18nTips.length; i < l; i++) {
        let el = i18nTips[i];
        let key = el.getAttribute('i18n-tips')
        let i18n = i18nJSON[key];
        if (key) {
            el.title = i18n;
        }
    }

    i18nCss.textContent = `
#menu::before {
    content: "${i18nJSON.popup_menu}";
}

#filter::before {
    content: "${i18nJSON.popup_queue}";
}

#system::before {
    content: "${i18nJSON.popup_system}";
}

#version::before {
    content: "${i18nJSON.popup_version}";
}

#download::before {
    content: "${i18nJSON.popup_download}";
}

#upload::before {
    content: "${i18nJSON.popup_upload}";
}

#active::before {
    content: "${i18nJSON.popup_active}";
}

#waiting::before {
    content: "${i18nJSON.popup_waiting}";
}

#stopped::before {
    content: "${i18nJSON.popup_stopped}";
}

.day:not(:empty)::after {
    content: "${i18nJSON.time_day}";
}

.hour:not(:empty)::after {
    content: "${i18nJSON.time_hour}";
}

.minute:not(:empty)::after {
    content: "${i18nJSON.time_minute}";
}

.second:not(:empty)::after {
    content: "${i18nJSON.time_second}";
}

.sample::before {
    content: "${i18nJSON.options_sample}";
    text-decoration: underline;
}

.default::before {
    content: "${i18nJSON.options_default} = ";
}

.disabled::before {
    content: "${i18nJSON.options_disabled} = ";
}
`;
}

(function () {
    let locale = getOptionValue('locale');
    i18nEntry.value = locale;
    i18nUserInterface(locale);
    let old_onopen = aria2RPC.onopen;
    aria2RPC.onopen = () => {
        old_onopen();
        aria2RPC.call('aria2.getGlobalOption').then((response) => {
            let config = response.result;
            config['disk-cache'] = getFileSize(config['disk-cache']);
            config['min-split-size'] = getFileSize(config['min-split-size']);
            config['max-upload-limit'] = getFileSize(config['max-upload-limit']);
            for (let i = 0, l = remoteEntries.length; i < l; i++) {
                let entry = remoteEntries[i];
                let name = entry.name;
                let value = config[name];
                if (value) {
                    entry.value = aria2Config[name] = value;
                }
            }
            downBtn.disabled = remoteBtn.disabled = false;
        }).catch(() => {
            downBtn.disabled = remoteBtn.disabled = true;
        });
    };
    for (let i = 0, l = optionsEntries.length; i < l; i++) {   
        let entry = optionsEntries[i];
        let name = entry.name;
        let value = entry.value = getOptionValue(name);
        if (entry.type === 'number') {
           value = entry.value | 0;
        }
        aria2Storage.set(name, value);
    }
    optionsDispatch();
})();
