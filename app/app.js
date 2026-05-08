const { app, BrowserWindow } = require('electron');
const path = require('path');
const wins = {
    width: 1310,
    height: 1156,
    autoHideMenuBar: true,
    menuBarVisible: false,
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
    }
};

let newWindow = null;

app.whenReady().then(() => {
    newWindow = new BrowserWindow(wins);
    const indexPath = path.join(app.getAppPath(), 'app/index.html');
    newWindow.loadFile(indexPath);
    newWindow.on('close', () => {
        newWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
