const { app, BrowserWindow } = require('electron');
const path = require('path');
const wins = {
    width: 1310,
    height: 1186,
    autoHideMenuBar: true,
    menuBarVisible: false,
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
    }
};

function createWindow() {
    const newWindow = new BrowserWindow(wins);
    const indexPath = path.join(process.resourcesPath, 'app/index.html');
    newWindow.loadFile(indexPath);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
