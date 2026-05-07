const { app, BrowserWindow } = require('electron');
const path = require('path');
const params = {
    width: 1200,
    height: 800,
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
    }
};

function createWindow() {
    const new_window = new BrowserWindow(params);
    new_window.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
