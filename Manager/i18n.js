var i18n;
var i18nUser = document.querySelector('#aria2_i18n');
var i18nCss = document.createElement('style');
var languages = {
    en: {
        manager_title: 'Aria2 Task Manager',
        common_default: 'Default',
        common_disabled: 'Disabled',
        common_save: 'Save',
        time_day: 'd',
        time_hour: 'h',
        time_minute: 'm',
        time_minute_full: 'Minute',
        time_second: 's',
        popup_newdld: 'New DL',
        popup_queue: 'Task Queue',
        popup_purge: 'Purge',
        popup_options: 'Options',
        queue_active: 'Downloading',
        queue_waiting: 'Wait in Queue',
        queue_paused: 'Download Paused',
        queue_complete: 'Completed',
        queue_removed: 'Download Stopped',
        queue_error: 'Error Occured',
        popup_download: 'DL Speed',
        popup_upload: 'UL Speed',
        popup_active: 'Active',
        popup_waiting: 'Waiting',
        popup_stopped: 'Stopped',
        task_submit: 'Submit',
        task_referer: 'Referer',
        task_entry: 'Download Urls',
        task_base64: 'Upload',
        task_download: 'Max Download Speed',
        task_upload: 'Max Upload Speed',
        task_proxy: 'Proxy Server',
        task_save: 'Save',
        task_files: 'Download Files',
        task_urls: 'Download Urls',
        aria2_adv_dir: 'Download Folder',
        aria2_http_split: 'Download Sections',
        aria2_http_size: 'Section Size',
        aria2_max_connection: 'Max Connections per Server',
        aria2_bt_ratio: 'Seeding Ratio',
        aria2_bt_seed: 'Seeding Time',
        aria2_bt_remove: 'Remove Unselected Files',
        aria2_true: 'True',
        aria2_false: 'False',
        option_jsonrpc: 'JSON-RPC Server',
        option_manager_interval: 'Refresh Interval'
    },
    zh: {
        manager_title: 'Aria2 任务管理器',
        common_default: '默认',
        common_disabled: '禁用',
        common_save: '保存',
        time_day: '日',
        time_hour: '时',
        time_minute: '分',
        time_minute_full: '分',
        time_second: '秒',
        popup_newdld: '新下载',
        popup_queue: '任务队列',
        popup_purge: '清理',
        popup_options: '选项',
        queue_active: '正在下载',
        queue_waiting: '等待队列',
        queue_paused: '下载暂停',
        queue_complete: '已经完成',
        queue_removed: '下载停止',
        queue_error: '发生错误',
        popup_download: '下载速度',
        popup_upload: '上传速度',
        popup_active: '活跃',
        popup_waiting: '等待',
        popup_stopped: '停止',
        task_submit: '确认',
        task_referer: '引用页',
        task_entry: '下载链接',
        task_base64: '上传',
        task_download: '最大下载速度',
        task_upload: '最大上传速度',        
        task_proxy: '代理服务器',
        task_save: '保存',
        task_files: '下载文件',
        task_urls: '下载链接',
        aria2_adv_dir: '下载文件夹',
        aria2_http_split: '多线程',
        aria2_http_size: '线程容量',
        aria2_max_connection: '每服务器最大连接数',
        aria2_bt_ratio: '分享率',
        aria2_bt_seed: '分享时间',
        aria2_bt_remove: '删除未选定文件',
        aria2_true: '是',
        aria2_false: '否',
        option_jsonrpc: 'JSON-RPC 服务器',
        option_manager_interval: '更新间隔'
    }
};

document.head.append(i18nCss);
i18nUser.addEventListener('change', (event) => i18nUserInterface(localStorage.locale = i18nUser.value));
i18nUserInterface(i18nUser.value = localStorage.locale || navigator.language.slice(0, 2));

function i18nUserInterface(lang) {
    i18n = languages[lang] ?? languages.en;
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
