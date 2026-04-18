const path = require('path');
const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  mainWindow = win;

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
}

function configureAutoUpdater() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', async (info) => {
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Aktualizace dostupna',
      message: `Nova verze ${info.version} je k dispozici.`,
      detail: 'Chcete ji stahnout a nainstalovat po restartu aplikace?',
      buttons: ['Stahnout aktualizaci', 'Pozdeji'],
      defaultId: 0,
      cancelId: 1
    });

    if (response.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.setProgressBar(Math.min(Math.max(progress.percent / 100, 0), 1));
    }
  });

  autoUpdater.on('update-downloaded', async (info) => {
    if (mainWindow) {
      mainWindow.setProgressBar(-1);
    }

    const response = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Aktualizace pripravena',
      message: `Verze ${info.version} je stazena a pripravená k instalaci.`,
      detail: 'Chcete aplikaci restartovat a nainstalovat aktualizaci?',
      buttons: ['Restartovat a nainstalovat', 'Pozdeji'],
      defaultId: 0,
      cancelId: 1
    });

    if (response.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
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
  createWindow();
  configureAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
