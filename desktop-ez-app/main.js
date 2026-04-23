const path = require('path');
const fs = require('fs/promises');
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

function buildPrintableHtmlDocument(title, bodyHtml) {
  if (/<html[\s>]/i.test(String(bodyHtml || ''))) {
    return String(bodyHtml);
  }

  return `<!DOCTYPE html>
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${String(title || 'EzFix tisk')}</title>
    </head>
    <body>${String(bodyHtml || '')}</body>
  </html>`;
}

async function createPrintWindow(html) {
  const printWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true
    }
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return printWindow;
}

function registerDesktopIpc() {
  ipcMain.handle('ezfix:list-printers', async (event) => {
    return event.sender.getPrintersAsync();
  });

  ipcMain.handle('ezfix:print-html', async (_event, payload = {}) => {
    const html = buildPrintableHtmlDocument(payload.title, payload.html);
    const printerName = String(payload.printerName || '').trim();
    const printWindow = await createPrintWindow(html);

    try {
      await new Promise((resolve, reject) => {
        printWindow.webContents.print({
          silent: Boolean(printerName),
          deviceName: printerName || undefined,
          printBackground: true,
          margins: { marginType: 'printableArea' }
        }, (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason || 'Tisk selhal'));
            return;
          }
          resolve();
        });
      });
      return { success: true };
    } finally {
      if (!printWindow.isDestroyed()) {
        printWindow.close();
      }
    }
  });

  ipcMain.handle('ezfix:save-pdf', async (_event, payload = {}) => {
    const html = buildPrintableHtmlDocument(payload.title, payload.html);
    const pdfWindow = await createPrintWindow(html);

    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Uložit PDF',
        defaultPath: String(payload.defaultFileName || 'ezfix-dokument.pdf'),
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });

      if (canceled || !filePath) {
        return { canceled: true };
      }

      const pdfBuffer = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true
      });
      await fs.writeFile(filePath, pdfBuffer);
      return { success: true, filePath };
    } finally {
      if (!pdfWindow.isDestroyed()) {
        pdfWindow.close();
      }
    }
  });
}

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

  // Configure delta/incremental updates
  autoUpdater.allowDowngrade = false;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.channel = 'latest';

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
  registerDesktopIpc();
  createWindow();
  configureAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
