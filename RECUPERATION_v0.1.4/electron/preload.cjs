const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bobeez', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  homeDirs: () => ipcRenderer.invoke('fs:home'),
  drives: () => ipcRenderer.invoke('fs:drives'),
  listDir: (p) => ipcRenderer.invoke('fs:listDir', p),
  listSubdirs: (p) => ipcRenderer.invoke('fs:listSubdirs', p),
  thumbnail: (p, mtime, size) => ipcRenderer.invoke('image:thumbnail', p, mtime, size),
  metadata: (p) => ipcRenderer.invoke('image:metadata', p),
  fullUrl: (p) => ipcRenderer.invoke('image:fullUrl', p),
  rotate: (p, deg) => ipcRenderer.invoke('image:rotate', p, deg),
  exportImage: (p, opts) => ipcRenderer.invoke('image:export', p, opts),
  rename: (p, name) => ipcRenderer.invoke('image:rename', p, name),
  trash: (p) => ipcRenderer.invoke('shell:trash', p),
  reveal: (p) => ipcRenderer.invoke('shell:reveal', p),
  openExternal: (p) => ipcRenderer.invoke('shell:openExternal', p),
  getSidecar: (p) => ipcRenderer.invoke('sidecar:get', p),
  setSidecar: (p, d) => ipcRenderer.invoke('sidecar:set', p, d),
  getFavorites: () => ipcRenderer.invoke('favorites:get'),
  setFavorites: (l) => ipcRenderer.invoke('favorites:set', l),
  version: () => ipcRenderer.invoke('app:version'),
  getState: () => ipcRenderer.invoke('state:get'),
  setState: (patch) => ipcRenderer.invoke('state:set', patch),
  getRecent: () => ipcRenderer.invoke('recent:get'),
  addRecent: (dir) => ipcRenderer.invoke('recent:add', dir),
  clearRecent: () => ipcRenderer.invoke('recent:clear'),
  copyText: (s) => ipcRenderer.invoke('clipboard:writeText', s),
  logError: (p) => ipcRenderer.invoke('log:error', p),
  logInfo: (m) => ipcRenderer.invoke('log:info', m),
  dominantColor: (p) => ipcRenderer.invoke('image:dominantColor', p),
  phash: (p) => ipcRenderer.invoke('image:phash', p),
  batchExport: (files, opts) => ipcRenderer.invoke('batch:export', files, opts),
  onBatchProgress: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('batch:progress', listener);
    return () => ipcRenderer.removeListener('batch:progress', listener);
  },
  // Auto-updater
  updaterCheck: () => ipcRenderer.invoke('updater:check'),
  updaterStatus: () => ipcRenderer.invoke('updater:status'),
  updaterInstall: () => ipcRenderer.invoke('updater:install'),
  updaterSetChannel: (beta) => ipcRenderer.invoke('updater:setChannel', beta),
  onUpdaterStatus: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
});
