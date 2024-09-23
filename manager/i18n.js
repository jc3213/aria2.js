var locale = {};
var i18nUser = document.querySelector('#aria2_i18n');
var i18nCss = document.createElement('style');
document.head.append(i18nCss);

i18nUser.value = localStorage.locale || navigator.language.slice(0, 2);
i18nUser.addEventListener('change', (event) => i18nUserInterface(localStorage.locale = i18nUser.value));

Promise.all([
    fetch('i18n/en.js'),
    fetch('i18n/zh.js')
]).then(async ([en, zh]) => {
    locale.en = await en.json();
    locale.zh = await zh.json();
    i18nUserInterface(i18nUser.value);
});

function i18nUserInterface(lang) {
    var i18n = locale[lang] ?? locale.en;
    document.querySelectorAll('[i18n]').forEach((item) => {
        item.textContent = i18n[item.getAttribute('i18n')];
    });
    i18nCss.innerText = `:root {
        --download: "${i18n.popup_download}";
        --upload: "${i18n.popup_upload}";
        --active: "${i18n.popup_active}";
        --waiting: "${i18n.popup_waiting}";
        --stopped: "${i18n.popup_stopped}";
        --queue: "${i18n.popup_queue}";
        --day: "${i18n.time_day}";
        --hour: "${i18n.time_hour}";
        --minute: "${i18n.time_minute}";
        --second: "${i18n.time_second}";
    }`;
}
