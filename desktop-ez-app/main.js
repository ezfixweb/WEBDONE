const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

function createWindow() {
  const appIconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'logos', 'app-icon.ico')
    : path.join(__dirname, 'assets', 'logos', 'app-icon.png');
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    autoHideMenuBar: true,
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [
        `--ezfix-app-name=${app.getName()}`,
        `--ezfix-app-version=${app.getVersion()}`
      ],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.removeMenu();
  mainWindow = win;

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
}

function configureAutoUpdater() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.setProgressBar(Math.min(Math.max(progress.percent / 100, 0), 1));
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.setProgressBar(-1);
    }
    console.log(`[auto-update] Version ${info.version} downloaded; it will install on next app restart.`);
  });

  autoUpdater.on('error', (err) => {
    console.error('[auto-update] Error:', err && err.message ? err.message : err);
  });

  const checkForUpdates = () => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[auto-update] Check failed:', err && err.message ? err.message : err);
    });
  };

  setTimeout(checkForUpdates, 5000);
  setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
  app.setAppUserModelId('cz.ezfix.desktop');
  Menu.setApplicationMenu(null);
  createWindow();
  configureAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
