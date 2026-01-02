const optionsPane = document.createElement('div');
optionsPane.id = 'setting';
optionsPane.className = 'hidden';
optionsPane.innerHTML = `
<div>
    <h4 i18n="option_jsonrpc">JSON-RPC Server</h4>
    <div class="flex">
        <input name="url" type="url">
        <input name="secret" type="password" placeholder="$$secret$$">
        <button id="json-rpc">⚙️</button>
    </div>
 </div>
<div class="flex">
    <div class="fl-1">
        <h4 i18n="option_jsonrpc_retries">Max Retries</h4>
        <input name="retries" type="number" min="-1" step="1">
    </div>
    <div class="fl-1">
        <h4 i18n="option_jsonrpc_timeout">Retry Interval</h4>
        <div>
            <input name="timeout" type="number" min="5" max="30" step="1">
            <span i18n="time_second_full"></span>
        </div>
    </div>
</div>
<div class="flex">
    <div class="fl-1">
        <h4 i18n="option_manager_interval">Update Interval</h4>
        <div>
            <input name="interval" type="number" min="1" max="60" step="1">
            <span i18n="time_second_full"></span>
        </div>
    </div>
    <div class="fl-1">
        <h4 i18n="task_proxy">Proxy Server</h4>
        <input name="proxy" type="url" placeholder="http://127.0.0.1:1230/">
    </div>
</div>
`;

const downPane = document.createElement('div');
downPane.id = 'adduri';
downPane.className = 'config hidden';
downPane.innerHTML = `
<div>
    <h4 i18n="task_referer">Referer</h4>
    <div class="flex">
        <input type="text">
        <button id="down-url" i18n="task_submit">Submit</button>
        <button id="down-file" i18n="task_base64">Upload</button>
        <input type="file" accept=".torrent, .metalink, .meta4" multiple>
    </div>
</div>
<div>
    <h4 i18n="task_entry">Download Urls</h4>
    <textarea rows="3"></textarea>
</div>
<div class="cfg-item">
    <h4 i18n="aria2_adv_dir">Download Folder</h4>
    <input name="dir" type="text">
</div>
<div class="cfg-item">
    <h4 i18n="task_proxy">Proxy Server</h4>
    <div class="flexmenu">
        <input name="all-proxy" type="url">
        <button id="all-proxy" i18n-tips="tips_proxy_server">⚡️</button>
    </div>
</div>
<div class="cfg-item">
    <h4 i18n="aria2_http_split">Download Sections</h4>
    <input name="split" type="number">
</div>
<div class="cfg-item">
    <h4 i18n="aria2_http_size">Section Size</h4>
    <div>
        <input name="min-split-size" type="text">
        <span class="float">B</span>
    </div>
</div>
<div class="cfg-item">
    <h4 i18n="aria2_max_connection">Max Connections per Server</h4>
    <input name="max-connection-per-server" type="number">
</div>
<div class="cfg-item">
    <h4 i18n="task_download">Max Download Speed</h4>
    <div>
        <input name="max-download-limit" type="text">
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
    <i class="sample" title="&quot;C:\Aria2\Download&quot; (Windows)&#10;&#10;&quot;/home/aria2/download&quot; (Linux)"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_file_alloc">
    <h4 i18n="aria2_file_alloc"></h4>
    <select name="file-allocation">
        <option value="none" i18n="option_disabled"></option>
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
        <option value="true" i18n="common_true"></option>
        <option value="false" i18n="common_false"></option>
    </select>
    <i class="default" i18n="common_false"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_max_concurrent">
    <h4 i18n="aria2_max_concurrent"></h4>
    <input name="max-concurrent-downloads" type="number">
    <i class="default">5</i>
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
        <option value="true" i18n="common_true"></option>
        <option value="false" i18n="common_false"></option>
    </select>
    <i class="default" i18n="common_true"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_dht6">
    <h4 i18n="aria2_bt_dht6"></h4>
    <select name="enable-dht6">
        <option value="true" i18n="common_true"></option>
        <option value="false" i18n="common_false"></option>
    </select>
    <i class="default" i18n="common_false"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_follow">
    <h4 i18n="aria2_bt_follow"></h4>
    <select name="follow-torrent">
        <option value="true" i18n="common_true"></option>
        <option value="false" i18n="common_false"></option>
    </select>
    <i class="default" i18n="common_true"></i>
</div>
<div class="cfg-item" i18n-tips="tips_aria2_bt_remove">
    <h4 i18n="aria2_bt_remove"></h4>
    <select name="bt-remove-unselected-file">
        <option value="true" i18n="common_true"></option>
        <option value="false" i18n="common_false"></option>
    </select>
    <i class="default" i18n="common_false"></i>
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
    <i class="default">30</i>
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

button.checked {
    border-style: inset;
}

h1:first-of-type {
    margin-top: 0px;
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

#adduri .config, #setting .config, jsonrpc .config {
    gap: 5px;
}

#adduri .flex > button, #setting .flex > button {
    height: 25px;
    padding: 0px 5px;
}

input[name="url"] {
    width: 200%;
}
`;

const i18nCss = document.createElement('style');

document.body.append(optionsPane, downPane, jsonrpcPane, extraCss, i18nCss);

let aria2Config = {};
let aria2Storage = new Map();

let optionsEntries = optionsPane.querySelectorAll('[name]');
let downloadEntries = downPane.querySelectorAll('[name]');
let jsonrpcEntries = jsonrpcPane.querySelectorAll('[name]');
let downEntry = downPane.querySelector('textarea');
let metaFiles = downPane.querySelector('input[type="file"]');

taskFilters(
    JSON.parse(localStorage.getItem('queue')) ?? [],
    (array) => localStorage.setItem('queue', JSON.stringify(array))
);

i18nEntry.addEventListener('change', (event) => {
    let locale = i18nEntry.value;
    localStorage.setItem('locale', locale);
    i18nUserInterface(locale);
});

downBtn.addEventListener('click', async (event) => {
    downBtn.classList.toggle('checked');
    downPane.classList.toggle('hidden');
    optionsBtn.classList.remove('checked');
    optionsPane.classList.add('hidden');
    jsonrpcPane.classList.add('hidden');
});

optionsBtn.addEventListener('click', (event) => {
    optionsBtn.classList.toggle('checked');
    optionsPane.classList.toggle('hidden');
    downBtn.classList.remove('checked');
    downPane.classList.add('hidden');
    jsonrpcPane.classList.add('hidden');
});

optionsPane.addEventListener('change', (event) => {
    let { name, type, value } = event.target;
    if (type === 'number') {
        value = value | 0;
    }
    aria2Storage.set(name, value);
    localStorage.setItem(name, value);
});

optionsPane.querySelector('button').addEventListener('click', (event) => {
    aria2RPC.disconnect();
    optionsDispatch();
    jsonrpcPane.classList.remove('hidden');
});

jsonrpcPane.addEventListener('change', (event) => {
    let { name, value } = event.taregt;
    aria2Config[name] = value;
});

function downEventSubmit() {
    let urls = downEntry.value.match(/(https?:\/\/|ftp:\/\/|magnet:\?)[^\s\n]+/g);
    if (!urls) {
        downBtn.click();
        return;
    }
    let options = { ...aria2Config };
    let { out } = options;
    options['out'] = urls.length !== 1 || !out ? null : out.replace(/[\\/:*?"<>|]/g, '_');
    let params = [];
    for (let url of urls) {
        params.push({ method: 'aria2.addUri', params: [[url], options] });
    }
    aria2RPC.call(params).then(() => {
        downBtn.click();
    });
}

async function metaFileDownload(files) {
    let options = { ...aria2Config };
    let datas = [];
    options['out'] = options['referer'] = options['user-agent'] = null;
    for (let file of files) {
        let { name } = file;
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
                let { result } = reader;
                params.unshift(result.substring(result.indexOf(',') + 1));
                resolve({ method: params });
            };
            reader.readAsDataURL(file);
        }));
    }
    let params = await Promise.all(datas);
    aria2RPC.call(params).then(() => {
        downBtn.click();
    });
}

const downEventMap = {
    'down-url': downEventSubmit,
    'down-file': () => metaFiles.click(),
    'all-proxy': (event) => event.target.previousElementSibling.value = aria2Storage.get('proxy')
};

downPane.addEventListener('click', (event) => {
    let { id, localName } = event.target;
    if (id || localName === 'button') {
        downEventMap[id](event);
    }
});

downPane.addEventListener('change', (event) => {
    let { name, value, files } = event.target;
    if (name) {
        aria2Config[name] = value;
    } else if (files) {
        metaFileDownload(files);
    }
});

downPane.addEventListener('dragover', (event) => {
    event.preventDefault();
});

downPane.addEventListener('drop', (event) => {
    event.preventDefault();
    metaFileDownload(event.dataTransfer.files);
});

const optionsDefault = {
    url: 'ws://localhost:6800/jsonrpc',
    secret: '',
    retries: 10,
    timeout: 10,
    interval: 10,
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
    setTimeout(() => {
        aria2RPC.call({ method: 'aria2.getGlobalOption' }).then(({ result }) => {
            result['min-split-size'] = getFileSize(result['min-split-size']);
            result['max-download-limit'] = getFileSize(result['max-download-limit']);
            result['max-upload-limit'] = getFileSize(result['max-upload-limit']);
            for (let entry of jsonrpcEntries) {
                let { name } = entry;
                aria2Config[name] = entry.value = result[name] ??= '';
            }
            for (let entry of downloadEntries) {
                let { name } = entry;
                entry.value = aria2Config[name];
            }
        });
    }, 500);
}

const i18nLang = new Set(['en-US', 'zh-CN']);

async function i18nUserInterface(lang) {
    let locale = await fetch(`i18n/${i18nLang.has(lang) ? lang : 'en-US'}.json`).then((res) => res.json());

    for (let item of document.querySelectorAll('[i18n]')) {
        item.textContent = locale[item.getAttribute('i18n')] ?? '';
    }

    for (let item of document.querySelectorAll('[i18n-tips]')) {
        item.title = locale[item.getAttribute('i18n-tips')] ?? '';
    }

    i18nCss.textContent = `
#menu::before {
    content: "${locale.popup_menu}";
}

#filter::before {
    content: "${locale.popup_queue}";
}

#system::before {
    content: "${locale.popup_system}";
}

#version::before {
    content: "${locale.popup_version}";
}

#download::before {
    content: "${locale.popup_download}";
}

#upload::before {
    content: "${locale.popup_upload}";
}

#active::before {
    content: "${locale.popup_active}";
}

#waiting::before {
    content: "${locale.popup_waiting}";
}

#stopped::before {
    content: "${locale.popup_stopped}";
}

.day:not(:empty)::after {
    content: "${locale.time_day}";
}

.hour:not(:empty)::after {
    content: "${locale.time_hour}";
}

.minute:not(:empty)::after {
    content: "${locale.time_minute}";
}

.second:not(:empty)::after {
    content: "${locale.time_second}";
}

.default::before {
    content: "${locale.common_default}";
}
`;
}

(function () {
    let locale = getOptionValue('locale');
    i18nEntry.value = locale;
    i18nUserInterface(locale);
    for (let entry of optionsEntries) {   
        let { name, type } = entry;
        let value = entry.value = getOptionValue(name);
        if (type === 'number') {
           value = entry.value | 0;
        }
        aria2Storage.set(name, value);
    }
    optionsDispatch();
})();
