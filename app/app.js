const { app, BrowserWindow } = require('electron');
const path = require('path');
const wins = {
    width: 1290,
    height: 840,
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
    }
};

function createWindow() {
    const newWindow = new BrowserWindow(wins);
    const indexPath = path.join(app.getAppPath(), 'app/index.html');
    newWindow.loadFile(indexPath);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
