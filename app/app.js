const { app, BrowserWindow } = require('electron');
const path = require('path');

let newWindow = null;

app.whenReady().then(() => {
    const indexPath = path.join(app.getAppPath(), 'app/index.html');
    newWindow = new BrowserWindow({
        width: 1310,
        height: 1156,
        autoHideMenuBar: true,
        menuBarVisible: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    newWindow.loadFile(indexPath);
    newWindow.on('closed', () => {
        newWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
