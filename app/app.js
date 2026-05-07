const { app, BrowserWindow } = require('electron');
const path = require('path');
const wins = {
    width: 1200,
    height: 800,
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
    }
};

function createWindow() {
    const newWindow = new BrowserWindow(wins);
    const indexPath = path.join(app.getAppPath(), 'app/index.html');
    newWndow.loadFile(indexPath);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
