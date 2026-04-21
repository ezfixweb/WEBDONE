const { contextBridge } = require('electron');
const pkg = require('./package.json');

contextBridge.exposeInMainWorld('ezfixDesktop', {
  appName: 'EzFix Manager',
  appVersion: String(pkg.version || '0.0.0')
});
