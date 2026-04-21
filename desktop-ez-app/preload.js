const { contextBridge } = require('electron');

function readDesktopArg(prefix, fallback) {
  const match = process.argv.find((arg) => String(arg || '').startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

contextBridge.exposeInMainWorld('ezfixDesktop', {
  appName: readDesktopArg('--ezfix-app-name=', 'EzFix Manager'),
  appVersion: readDesktopArg('--ezfix-app-version=', '0.0.0')
});
