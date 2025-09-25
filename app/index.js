var aria2Config = {};
var acceptLang = ['en-US', 'zh-CN'];

taskFilters(
    JSON.parse(localStorage.getItem('queue')),
    (array) => localStorage.setItem('queue', JSON.stringify(array))
);

var [optionsPane, ...optionEntries] = document.querySelectorAll('#setting, #setting [name]');
var [downPane, ...downloadEntries]= document.querySelectorAll('#adduri, #adduri [name]');
var [saveBtn, submitBtn, metaBtn, metaEntry, UrlEntry, proxyBtn] = document.querySelectorAll('#adduri button, #setting button, textarea, input[type="file"');
var i18nCss = document.createElement('style');
document.head.append(i18nCss);

i18nEntry.value = localStorage.locale ??= navigator.language.slice(0, 2);
i18nEntry.addEventListener('change', (event) => {
    localStorage.locale = i18nEntry.value;
    i18nUserInterface();
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
    aria2StorageUpdated();
});

submitBtn.addEventListener('click', (event) => {
    var sessions = [];
    var urls = UrlEntry.value.match(/(https?:\/\/|ftp:\/\/|magnet:\?)[^\s\n]+/g);
    urls?.forEach((url) => sessions.push({ url, options: aria2Config }));
    aria2RPC.call(...sessions);
    UrlEntry.value = '';
    downBtn.classList.remove('checked');
    downPane.classList.add('hidden');
});

proxyBtn.addEventListener('click', (event) => {
    event.target.previousElementSibling.value = localStorage.aria2Proxy || '';
});

optionsPane.addEventListener('change', (event) => {
    localStorage.setItem(event.target.name, event.target.value);
});

downPane.addEventListener('change', (event) => {
    aria2Config[event.target.name] = event.target.value;
});

metaEntry.addEventListener('change', async (event) => {
    var sessions = [];
    await Promise.all([...event.target.files].map(async (file) => {
        var type = file.name.slice(file.name.lastIndexOf('.') + 1);
        var b64encode = await promiseFileReader(file);
        var download = type === 'torrent' ? { method: 'aria2.addTorrent', params: [b64encode, [], aria2Config] } : { method: 'aria2.addMetalink', params: [b64encode, aria2Config] };
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

const defaultStorage = {
    scheme: 'http',
    url: 'localhost:6800/jsonrpc',
    retries: 10;
    timeout = 10;
};

function storageLoader(key) {
    let value = localStorage.getItem('scheme');
    if (value === '' && key in defaultStorage) {
        return defaultStorage[key];
    }
    return value;
}

function aria2StorageUpdated() {
    aria2RPC.scheme = storageLoader('scheme');
    aria2RPC.url = storageLoader('url');
    aria2RPC.secret = localStorage.getItem('secret');
    aria2RPC.retries = storageLoader('retries') | 0;
    aria2RPC.timeout = storageLoader('timeout') | 0;
    aria2Proxy = localStorage.getItem('proxy');
    aria2Delay = aria2RPC.timeout * 1000;
    aria2RPC.connect();
}

(function () {
    i18nUserInterface();
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
    }, 1000);
})();

async function i18nUserInterface() {
    var locale = localStorage.locale;
    var lang = acceptLang.includes(locale) ? locale : 'en-US';
    var i18n = await fetch('i18n/' + lang + '.json').then((res) => res.json());

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

