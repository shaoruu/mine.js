const path = require('path');

const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve');

const loadURL = serve({ directory: 'public' });

require('electron-reload')(path.join(__dirname, '..', 'public'), {
  electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
});

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  await loadURL(win);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
