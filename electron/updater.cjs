// Auto-update layer using electron-updater + GitHub Releases.
//
// Status flow broadcast to renderer via 'updater:status' :
//   idle → checking → available → downloading → ready
//                  ↘ not-available
//                  ↘ error
//
// Beta channel: when state.betaChannel === true we set autoUpdater.allowPrerelease.
// In dev (not packaged) the updater is a no-op so we never hit GitHub from a
// developer machine.

const { app } = require('electron');
const path = require('node:path');
const fsSync = require('node:fs');

let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; }
catch (e) { console.warn('[updater] electron-updater not loaded:', e.message); }

const STATE_FILE = path.join(app.getPath('userData'), 'state.json');

function readState() {
  try { return JSON.parse(fsSync.readFileSync(STATE_FILE, 'utf8')); }
  catch { return {}; }
}

let mainWindowRef = null;
let lastStatus = { phase: 'idle', currentVersion: app.getVersion() };

function send(status) {
  lastStatus = status;
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('updater:status', status);
  }
}

function applyChannel() {
  if (!autoUpdater) return;
  const state = readState();
  autoUpdater.allowPrerelease = !!state.betaChannel;
  autoUpdater.channel = state.betaChannel ? 'beta' : 'latest';
}

function initUpdater(mainWindow) {
  mainWindowRef = mainWindow;
  if (!autoUpdater) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.logger = {
    info: (m) => console.log('[updater]', m),
    warn: (m) => console.warn('[updater]', m),
    error: (m) => console.error('[updater]', m),
    debug: () => {},
  };
  applyChannel();

  autoUpdater.on('checking-for-update', () => {
    send({ phase: 'checking', currentVersion: app.getVersion() });
  });

  autoUpdater.on('update-available', (info) => {
    send({
      phase: 'available',
      currentVersion: app.getVersion(),
      nextVersion: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    send({ phase: 'not-available', currentVersion: app.getVersion() });
  });

  autoUpdater.on('download-progress', (p) => {
    const next = lastStatus.phase === 'available' || lastStatus.phase === 'downloading'
      ? lastStatus.nextVersion : '';
    send({
      phase: 'downloading',
      currentVersion: app.getVersion(),
      nextVersion: next,
      percent: Math.round(p.percent || 0),
      bytesPerSecond: Math.round(p.bytesPerSecond || 0),
      transferred: p.transferred,
      total: p.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    send({
      phase: 'ready',
      currentVersion: app.getVersion(),
      nextVersion: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    });
  });

  autoUpdater.on('error', (err) => {
    send({
      phase: 'error',
      currentVersion: app.getVersion(),
      message: err?.message || String(err),
    });
  });

  if (app.isPackaged) {
    setTimeout(() => check().catch(() => {}), 4000);
  } else {
    console.log('[updater] dev mode — auto-update disabled');
  }
}

async function check() {
  if (!autoUpdater) {
    send({ phase: 'error', currentVersion: app.getVersion(), message: 'electron-updater non disponible' });
    return;
  }
  if (!app.isPackaged) {
    send({ phase: 'not-available', currentVersion: app.getVersion() });
    return;
  }
  applyChannel();
  try { await autoUpdater.checkForUpdates(); }
  catch (e) {
    send({ phase: 'error', currentVersion: app.getVersion(), message: e?.message || String(e) });
  }
}

function quitAndInstall() {
  if (!autoUpdater || lastStatus.phase !== 'ready') return;
  setImmediate(() => autoUpdater.quitAndInstall(true, true));
}

function getStatus() { return lastStatus; }

function setChannel(beta) {
  applyChannel();
  // If user just opted in to beta, refresh the check immediately.
  if (beta && app.isPackaged) check().catch(() => {});
}

module.exports = { initUpdater, check, quitAndInstall, getStatus, setChannel };
