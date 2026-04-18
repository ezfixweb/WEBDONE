const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ezfixDesktop', {
  appName: 'EzFix Manager',
  appVersion: '1.0.0'
});
