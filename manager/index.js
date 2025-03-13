var aria2Config = {};
var aria2Storage = {};
var acceptLang = ['en', 'zh'];

var optionEntries = document.querySelectorAll('#setting [name]');
var [downPane, ...downloadEntries]= document.querySelectorAll('#adduri, #adduri [name]');
var [statusEntry, versionEntry, i18nEntry] = document.querySelectorAll('#about > *');
var [saveBtn, submitBtn, metaBtn, metaEntry, UrlEntry, proxyBtn] = document.querySelectorAll('#adduri button, #setting button, textarea, input[type="file"');
var i18nCss = document.createElement('style');
document.head.append(i18nCss);

i18nEntry.value = localStorage.locale ??= navigator.language.slice(0, 2);
i18nEntry.addEventListener('change', (event) => {
    localStorage.locale = i18nEntry.value;
    i18nUserInterface();
});

downBtn.addEventListener('click', async (event) => {
    manager.toggle('adduri');
    manager.remove('setting')
});

optionsBtn.addEventListener('click', (event) => {
    manager.toggle('setting');
    manager.remove('adduri');
});

saveBtn.addEventListener('click', (event) => {
    optionEntries.forEach((entry) => { 
        localStorage[entry.name] = config[entry.name] ?? entry.dataset.value; 
    });
    aria2RPC.scheme = aria2Storage.scheme;
    aria2RPC.url = aria2Storage.jsonrpc;
    aria2RPC.secret = aria2Storage.scheme;
    aria2Proxy = aria2Storage.proxy;
    aria2Period = aria2Storage.interval * 1000;
    clearInterval(aria2Interval);
    aria2Interval = setInterval(aria2ClientUpdate, aria2Period);
    changes = {};
});

submitBtn.addEventListener('click', (event) => {
    var sessions = [];
    var urls = UrlEntry.value.match(/(https?:\/\/|ftp:\/\/|magnet:\?)[^\s\n]+/g);
    urls?.forEach((url) => sessions.push({url, options: aria2Config}));
    aria2RPC.call(...sessions);
    UrlEntry.value = '';
    manager.remove('adduri');
});

proxyBtn.addEventListener('click', (event) => {
    event.target.previousElementSibling.value = localStorage.aria2Proxy || '';
});

downPane.addEventListener('change', (event) => {
    var {name, value} = event.target;
    aria2Config[name] = value;
});

metaEntry.addEventListener('change', async (event) => {
    var sessions = [];
    await Promise.all([...event.target.files].map(async (file) => {
        var type = file.name.slice(file.name.lastIndexOf('.') + 1);
        var b64encode = await promiseFileReader(file);
        var download = type === 'torrent' ? {method: 'aria2.addTorrent', params: [b64encode, [], aria2Config]} : {method: 'aria2.addMetalink', params: [b64encode, aria2Config]};
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

(function () {
    i18nUserInterface()
    optionEntries.forEach((entry) => {
        aria2Storage[entry.name] = entry.value = localStorage[entry.name] ??= entry.dataset.value;
    });
    aria2Proxy = aria2Storage.proxy;
    aria2Delay = aria2Storage.interval * 1000;
    aria2RPC = new Aria2(aria2Storage.scheme, aria2Storage.jsonrpc, aria2Storage.secret);
    aria2RPC.onopen = async () => {
        aria2ClientOpened();
        var [global, version] = await aria2RPC.call({method: 'aria2.getGlobalOption'}, {method: 'aria2.getVersion'});
        var options = global.result;
        options['min-split-size'] = getFileSize(options['min-split-size']);
        options['max-download-limit'] = getFileSize(options['max-download-limit']);
        options['max-upload-limit'] = getFileSize(options['max-upload-limit']);
        downloadEntries.forEach((entry) => {
            aria2Config[entry.name] = entry.value = options[entry.name] ??= '';
        });
        versionEntry.textContent = version.result.version;
    }
    aria2RPC.onclose = () => {
        aria2ClientClosed();
    };
    aria2RPC.onmessage = aria2ClientMessage;
})();

async function i18nUserInterface() {
    var locale = localStorage.locale;
    var lang = acceptLang.includes(locale) ? locale : 'en';
    var i18n = await fetch('i18n/' + lang + '.json').then((res) => res.json());

    document.querySelectorAll('[i18n]').forEach((item) => {
        item.textContent = i18n[item.getAttribute('i18n')];
    });

    i18nCss.textContent = `
:root {
    --menu: "${i18n.popup_menu}";
    --queue: "${i18n.popup_queue}";
    --about: "${i18n.popup_about}";
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
