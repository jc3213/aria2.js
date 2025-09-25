let aria2Config = {};
let aria2Update = new Map();
let acceptLang = new Set(['en-US', 'zh-CN']);

let [optionsPane, ...optionEntries] = document.querySelectorAll('#setting, #setting [name]');
let [downPane, ...downloadEntries]= document.querySelectorAll('#adduri, #adduri [name]');
let [saveBtn, submitBtn, metaBtn, metaEntry, UrlEntry, proxyBtn] = document.querySelectorAll('#adduri button, #setting button, textarea, input[type="file"');
let i18nCss = document.createElement('style');
document.head.append(i18nCss);

taskFilters(
    JSON.parse(localStorage.getItem('queue')),
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

saveBtn.addEventListener('click', (event) => {
    aria2RPC.disconnect();
    aria2Update.forEach((value, key) => localStorage.setItem(key, value));
    aria2StorageUpdated();
});

submitBtn.addEventListener('click', (event) => {
    let urls = UrlEntry.value.match(/(https?:\/\/|ftp:\/\/|magnet:\?)[^\s\n]+/g);
    UrlEntry.value = '';
    downBtn.classList.remove('checked');
    downPane.classList.add('hidden');
    let session = urls?.map((url) => ({ url, options: aria2Config }));
    if (session) {
        aria2RPC.call(...sessions);
    }
});

proxyBtn.addEventListener('click', (event) => {
    event.target.previousElementSibling.value = localStorage.aria2Proxy || '';
});

optionsPane.addEventListener('change', (event) => {
    aria2Update.set(event.target.name, event.target.value);
});

downPane.addEventListener('change', (event) => {
    aria2Config[event.target.name] = event.target.value;
});

metaEntry.addEventListener('change', async (event) => {
    let sessions = [];
    await Promise.all([...event.target.files].map(async (file) => {
        let type = file.name.slice(file.name.lastIndexOf('.') + 1);
        let b64encode = await promiseFileReader(file);
        let download = type === 'torrent' ? { method: 'aria2.addTorrent', params: [b64encode, [], aria2Config] } : { method: 'aria2.addMetalink', params: [b64encode, aria2Config] };
        sessions.push(download);
    }));
    await aria2RPC.call(...sessions);
    event.target.value = '';
    manager.remove('adduri');
});

function promiseFileReader(file) {
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            let base64 = reader.result.slice(reader.result.indexOf(',') + 1);
            resolve(base64);
        };
        reader.readAsDataURL(file);
    });
}

const defaultStorage = {
    scheme: 'http',
    url: 'localhost:6800/jsonrpc',
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
    aria2RPC.scheme = localStorage.getItem('scheme');
    aria2RPC.url = localStorage.getItem('url');
    aria2RPC.secret = localStorage.getItem('secret');
    aria2RPC.retries = localStorage.getItem('retries') | 0;
    aria2RPC.timeout = localStorage.getItem('timeout') | 0;
    aria2Proxy = localStorage.getItem('proxy');
    aria2Delay = aria2RPC.timeout * 1000;
    aria2RPC.connect();
}

(function () {
    let locale = storageLoader('locale');
    i18nUserInterface(locale);
    optionEntries.forEach((entry) => {
        entry.value = storageLoader(entry.name);
    });
    aria2StorageUpdated();
    setTimeout(() => {
        aria2RPC.call({ method: 'aria2.getGlobalOption' }).then(([{ result }]) => {
            result['min-split-size'] = getFileSize(result['min-split-size']);
            result['max-download-limit'] = getFileSize(result['max-download-limit']);
            result['max-upload-limit'] = getFileSize(result['max-upload-limit']);
            downloadEntries.forEach((entry) => {
                let { name } = entry;
                aria2Config[name] = entry.value = result[name] ??= '';
            });
        });
    }, 500);
})();

async function i18nUserInterface(locale) {
    let lang = acceptLang.has(locale) ? locale : 'en-US';
    let i18n = await fetch('i18n/' + lang + '.json').then((res) => res.json());

    document.querySelectorAll('[i18n]').forEach((item) => {
        item.textContent = i18n[item.getAttribute('i18n')];
    });

    i18nCss.textContent = `
:root {
    --menu: "${i18n.popup_menu}";
    --queue: "${i18n.popup_queue}";
    --system: "${i18n.popup_system}";
    --version: "${i18n.popup_version}";
    --download: "${i18n.popup_download}";
    --upload: "${i18n.popup_upload}";
    --active: "${i18n.popup_active}";
    --waiting: "${i18n.popup_waiting}";
    --stopped: "${i18n.popup_stopped}";
    --day: "${i18n.time_day}";
    --hour: "${i18n.time_hour}";
    --minute: "${i18n.time_minute}";
    --second: "${i18n.time_second}";
}`;
}


