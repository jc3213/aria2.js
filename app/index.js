const optionsPane = document.createElement('div');
optionsPane.id = 'setting';
optionsPane.className = 'hidden';
optionsPane.innerHTML = `
<div>
    <h4 i18n="option_jsonrpc">JSON-RPC Server</h4>
    <div class="flex">
        <input name="url" type="url">
        <input name="secret" type="password" placeholder="$$secret$$">
        <button i18n="common_save">Save</button>
    </div>
 </div>
<div class="flex">
    <div class="fl-1">
        <h4 i18n="option_jsonrpc_retries">Max Retries</h4>
        <input name="retries" type="number" min="-1" step="1">
    </div>
    <div class="fl-1">
        <h4 i18n="option_jsonrpc_timeout">Retry Interval</h4>
        <input name="timeout" type="number" min="5" max="30" step="1">
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
        <button id="all-proxy">⚡️</button>
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

#adduri, #setting {
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

#adduri .config, #setting .config {
    gap: 5px;
}
`;

const i18nCss = document.createElement('style');

document.body.append(optionsPane, downPane, extracss, i18nCss);

let aria2Config = {};
let aria2Storage = new Map();
let acceptLang = new Set(['en-US', 'zh-CN']);

let optionEntries = optionsPane.querySelectorAll('[name]');
let downloadEntries = downPane.querySelectorAll('[name]');
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
});

optionsBtn.addEventListener('click', (event) => {
    optionsBtn.classList.toggle('checked');
    optionsPane.classList.toggle('hidden');
    downBtn.classList.remove('checked');
    downPane.classList.add('hidden');
});

optionsPane.addEventListener('change', (event) => {
    let { name, value } = event.target;
    aria2Storage.set(name, value);
});

optionsPane.querySelector('button').addEventListener('click', (event) => {
    aria2RPC.disconnect();
    for (let [key, value] of aria2Storage) {
        localStorage.setItem(key, value);
    }
    aria2StorageUpdated();
});

function downEventSubmit() {
    let urls = downEntry.value.match(/(https?:\/\/|ftp:\/\/|magnet:\?)[^\s\n]+/g) ?? [];
    let { out } = aria2Config;
    aria2Config['out'] = urls.length !== 1 || !out ? null : out.replace(/[\\/:*?"<>|]/g, '_');
    let params = [];
    for (let url of urls) {
        params.push({ method: 'aria2.addUri', params: [[url], aria2Config] });
    }
    aria2RPC.call(params).then(() => {
        downBtn.click();
    });
}

async function metaFileDownload(files) {
    aria2Config['out'] = aria2Config['referer'] = aria2Config['user-agent'] = null;
    let datas = [];
    for (let file of files) {
        let { name } = file;
        let method;
        let params = [aria2Config];
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

const defaultStorage = {
    url: 'ws://localhost:6800/jsonrpc',
    secret: '',
    retries: 10,
    timeout: 10,
    proxy: '',
    locale: 'en-US'
};

function storageLoader(key) {
    let value = localStorage.getItem(key);
    if (value === null) {
        let new_value = defaultStorage[key];
        localStorage.setItem(key, new_value);
        return new_value;
    }
    return value;
}

function aria2StorageUpdated() {
    aria2RPC.scheme = aria2Storage.get('scheme');
    aria2RPC.url = aria2Storage.get('url');
    aria2RPC.secret = aria2Storage.get('secret');
    aria2RPC.retries = aria2Storage.get('retries') | 0;
    aria2RPC.timeout = aria2Storage.get('timeout') | 0;
    aria2Proxy = aria2Storage.get('proxy');
    aria2Delay = aria2RPC.timeout * 1000;
    aria2RPC.connect();
    setTimeout(() => {
        aria2RPC.call({ method: 'aria2.getGlobalOption' }).then(({ result }) => {
            result['min-split-size'] = getFileSize(result['min-split-size']);
            result['max-download-limit'] = getFileSize(result['max-download-limit']);
            result['max-upload-limit'] = getFileSize(result['max-upload-limit']);
            for (let entry of downloadEntries) {
                let { name } = entry;
                aria2Config[name] = entry.value = result[name] ??= '';
            }
        });
    }, 500);
}

(function () {
    let locale = storageLoader('locale');
    i18nEntry.value = locale;
    i18nUserInterface(locale);
    for (let entry of optionEntries) {   
        let { name } = entry;
        let value = entry.value = storageLoader(name);
        aria2Storage.set(name, value);
    }
    aria2StorageUpdated();
})();

async function i18nUserInterface(locale) {
    let lang = acceptLang.has(locale) ? locale : 'en-US';
    let i18n = await fetch('i18n/' + lang + '.json').then((res) => res.json());

    for (let item of document.querySelectorAll('[i18n]')) {
        item.textContent = i18n[item.getAttribute('i18n')];
    }

    for (let item of document.querySelectorAll('[i18n-tips]')) {
        item.title = i18n[item.getAttribute('i18n-tips')];
    }

    i18nCss.textContent = `
#menu::before {
    content: "${i18n.popup_menu}";
}

#filter::before {
    content: "${i18n.popup_queue}";
}

#system::before {
    content: "${i18n.popup_system}";
}

#version::before {
    content: "${i18n.popup_version}";
}

#download::before {
    content: "${i18n.popup_download}";
}

#upload::before {
    content: "${i18n.popup_upload}";
}

#active::before {
    content: "${i18n.popup_active}";
}

#waiting::before {
    content: "${i18n.popup_waiting}";
}

#stopped::before {
    content: "${i18n.popup_stopped}";
}

.day:not(:empty)::after {
    content: "${i18n.time_day}";
}

.hour:not(:empty)::after {
    content: "${i18n.time_hour}";
}

.minute:not(:empty)::after {
    content: "${i18n.time_minute}";
}

.second:not(:empty)::after {
    content: "${i18n.time_second}";
}
`;
