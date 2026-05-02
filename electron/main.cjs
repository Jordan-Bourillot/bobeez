const { app, BrowserWindow, ipcMain, dialog, shell, protocol, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

let sharp = null;
try { sharp = require('sharp'); } catch (e) { console.warn('sharp not loaded:', e.message); }
let exifr = null;
try { exifr = require('exifr'); } catch (e) { console.warn('exifr not loaded:', e.message); }

const updater = require('./updater.cjs');

const IS_DEV = !app.isPackaged && process.env.BOBEEZ_DEV === '1';
const SUPPORTED_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif',
  '.avif', '.heic', '.heif', '.svg', '.ico', '.jfif',
  '.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.rw2', '.orf', '.psd',
]);

const THUMB_DIR = path.join(app.getPath('userData'), 'thumbnails');
const SIDECAR_DIR = path.join(app.getPath('userData'), 'sidecars');
const FAVORITES_FILE = path.join(app.getPath('userData'), 'favorites.json');
const STATE_FILE = path.join(app.getPath('userData'), 'state.json');
const RECENT_FILE = path.join(app.getPath('userData'), 'recent.json');

function readJsonSync(file, fallback) {
  try { return JSON.parse(fsSync.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function writeJsonSync(file, data) {
  try { fsSync.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
  catch (e) { console.warn('writeJson failed:', e.message); }
}

function toBobeezUrl(filePath) {
  const b64 = Buffer.from(filePath, 'utf8').toString('base64url');
  return 'bobeez://f/' + b64;
}

function ensureDirs() {
  for (const d of [THUMB_DIR, SIDECAR_DIR]) {
    if (!fsSync.existsSync(d)) fsSync.mkdirSync(d, { recursive: true });
  }
}

function isImageFile(name) {
  return SUPPORTED_EXTS.has(path.extname(name).toLowerCase());
}

function thumbKey(filePath, mtimeMs, size) {
  const crypto = require('node:crypto');
  const h = crypto.createHash('sha1').update(filePath + '|' + mtimeMs + '|' + size).digest('hex');
  return path.join(THUMB_DIR, h + '.jpg');
}

function sidecarPath(filePath) {
  const crypto = require('node:crypto');
  const h = crypto.createHash('sha1').update(filePath).digest('hex');
  return path.join(SIDECAR_DIR, h + '.json');
}

async function createWindow() {
  const icoPath = path.join(__dirname, '..', 'src', 'assets', 'bobeez.ico');
  const pngPath = path.join(__dirname, '..', 'src', 'assets', 'mascot', 'logo.png');
  const iconPath = fsSync.existsSync(icoPath) ? icoPath : pngPath;
  const state = readJsonSync(STATE_FILE, {});
  const bounds = state.bounds || { width: 1400, height: 900 };

  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1115',
    title: 'Bobeez',
    icon: fsSync.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (state.maximized) win.maximize();

  Menu.setApplicationMenu(null);

  // Persist bounds on close / move / resize
  let saveTimer = null;
  const saveBounds = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const cur = readJsonSync(STATE_FILE, {});
      if (!win.isMaximized()) cur.bounds = win.getBounds();
      cur.maximized = win.isMaximized();
      writeJsonSync(STATE_FILE, cur);
    }, 400);
  };
  win.on('resize', saveBounds);
  win.on('move', saveBounds);
  win.on('maximize', saveBounds);
  win.on('unmaximize', saveBounds);

  if (IS_DEV) {
    await win.loadURL('http://localhost:5173');
  } else {
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Wire auto-updater after window is loaded so events can be broadcast.
  updater.initUpdater(win);
}

app.whenReady().then(() => {
  ensureDirs();

  // Custom protocol — paths encoded as base64url to dodge Windows path / URL parsing issues
  protocol.registerFileProtocol('bobeez', (request, callback) => {
    try {
      const u = new URL(request.url);
      const b64 = u.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
      const filePath = Buffer.from(b64, 'base64url').toString('utf8');
      callback({ path: filePath });
    } catch (e) {
      console.error('protocol error:', e.message, request.url);
      callback({ error: -2 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC ----------

ipcMain.handle('dialog:openFolder', async () => {
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('fs:home', async () => {
  return {
    home: os.homedir(),
    pictures: app.getPath('pictures'),
    desktop: app.getPath('desktop'),
    downloads: app.getPath('downloads'),
  };
});

ipcMain.handle('fs:listDir', async (_e, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const dirs = [];
    const files = [];
    for (const en of entries) {
      if (en.name.startsWith('.')) continue;
      const full = path.join(dirPath, en.name);
      try {
        if (en.isDirectory()) {
          dirs.push({ name: en.name, path: full, isDir: true });
        } else if (en.isFile() && isImageFile(en.name)) {
          const st = await fs.stat(full);
          files.push({
            name: en.name,
            path: full,
            isDir: false,
            size: st.size,
            mtime: st.mtimeMs,
          });
        }
      } catch {}
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    return { dirs, files };
  } catch (e) {
    return { dirs: [], files: [], error: e.message };
  }
});

ipcMain.handle('fs:listSubdirs', async (_e, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('$'))
      .map(e => ({ name: e.name, path: path.join(dirPath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
});

ipcMain.handle('fs:drives', async () => {
  if (process.platform !== 'win32') return [{ name: '/', path: '/' }];
  const drives = [];
  for (let c = 65; c <= 90; c++) {
    const letter = String.fromCharCode(c) + ':\\';
    try {
      await fs.access(letter);
      drives.push({ name: String.fromCharCode(c) + ':', path: letter });
    } catch {}
  }
  return drives;
});

ipcMain.handle('image:thumbnail', async (_e, filePath, mtime, size = 256) => {
  if (!sharp) return { url: toBobeezUrl(filePath) };
  const out = thumbKey(filePath, mtime, size);
  try {
    await fs.access(out);
    return { url: toBobeezUrl(out) };
  } catch {}
  try {
    await sharp(filePath, { failOn: 'none' })
      .rotate()
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
    return { url: toBobeezUrl(out) };
  } catch (e) {
    return { url: toBobeezUrl(filePath), error: e.message };
  }
});

ipcMain.handle('image:metadata', async (_e, filePath) => {
  const meta = { path: filePath };
  try {
    const st = await fs.stat(filePath);
    meta.size = st.size;
    meta.mtime = st.mtimeMs;
  } catch {}
  if (sharp) {
    try {
      const m = await sharp(filePath).metadata();
      meta.width = m.width;
      meta.height = m.height;
      meta.format = m.format;
      meta.channels = m.channels;
      meta.density = m.density;
    } catch {}
  }
  if (exifr) {
    try {
      const ex = await exifr.parse(filePath, { tiff: true, exif: true, gps: true });
      if (ex) meta.exif = ex;
    } catch {}
  }
  return meta;
});

ipcMain.handle('image:fullUrl', async (_e, filePath) => {
  return toBobeezUrl(filePath);
});

ipcMain.handle('image:rotate', async (_e, filePath, degrees) => {
  if (!sharp) throw new Error('sharp non disponible');
  const buf = await sharp(filePath, { failOn: 'none' }).rotate(degrees).toBuffer();
  await fs.writeFile(filePath, buf);
  return { ok: true };
});

ipcMain.handle('image:export', async (_e, filePath, opts) => {
  if (!sharp) throw new Error('sharp non disponible');
  const r = await dialog.showSaveDialog({
    defaultPath: path.basename(filePath, path.extname(filePath)) + '.' + (opts.format || 'jpg'),
    filters: [
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
      { name: 'PNG', extensions: ['png'] },
      { name: 'WebP', extensions: ['webp'] },
      { name: 'AVIF', extensions: ['avif'] },
    ],
  });
  if (r.canceled || !r.filePath) return { canceled: true };
  let pipe = sharp(filePath, { failOn: 'none' }).rotate();
  if (opts.resize) pipe = pipe.resize(opts.resize, null, { withoutEnlargement: true });
  const ext = path.extname(r.filePath).toLowerCase().slice(1);
  if (ext === 'jpg' || ext === 'jpeg') pipe = pipe.jpeg({ quality: opts.quality || 90, mozjpeg: true });
  else if (ext === 'png') pipe = pipe.png({ compressionLevel: 9 });
  else if (ext === 'webp') pipe = pipe.webp({ quality: opts.quality || 90 });
  else if (ext === 'avif') pipe = pipe.avif({ quality: opts.quality || 70 });
  await pipe.toFile(r.filePath);
  return { ok: true, path: r.filePath };
});

ipcMain.handle('sidecar:get', async (_e, filePath) => {
  const sp = sidecarPath(filePath);
  try {
    const txt = await fs.readFile(sp, 'utf8');
    return JSON.parse(txt);
  } catch {
    return { tags: [], rating: 0, label: null, adjustments: null };
  }
});

ipcMain.handle('sidecar:set', async (_e, filePath, data) => {
  const sp = sidecarPath(filePath);
  await fs.writeFile(sp, JSON.stringify(data, null, 2), 'utf8');
  return { ok: true };
});

ipcMain.handle('favorites:get', async () => {
  try {
    const txt = await fs.readFile(FAVORITES_FILE, 'utf8');
    return JSON.parse(txt);
  } catch {
    return [];
  }
});

ipcMain.handle('favorites:set', async (_e, list) => {
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(list, null, 2), 'utf8');
  return { ok: true };
});

ipcMain.handle('shell:trash', async (_e, filePath) => {
  try {
    await shell.trashItem(filePath);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('shell:reveal', async (_e, filePath) => {
  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle('shell:openExternal', async (_e, target) => {
  // mailto:, http(s)://, etc. → openExternal ; absolute path → openPath
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) && !/^[a-z]:[\\/]/i.test(target)) {
    await shell.openExternal(target);
  } else {
    await shell.openPath(target);
  }
  return { ok: true };
});

ipcMain.handle('image:rename', async (_e, oldPath, newName) => {
  try {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    await fs.rename(oldPath, newPath);
    return { ok: true, path: newPath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('app:version', () => app.getVersion());

// ---------- Auto-updater ----------
let updaterTriggeredQuit = false;
ipcMain.handle('updater:check', () => updater.check());
ipcMain.handle('updater:status', () => updater.getStatus());
ipcMain.handle('updater:install', () => {
  updaterTriggeredQuit = true;
  updater.quitAndInstall();
});
ipcMain.handle('updater:setChannel', (_e, beta) => {
  updater.setChannel(!!beta);
  return { ok: true };
});

// ---------- Renderer error reporting ----------
ipcMain.handle('log:error', async (_e, payload) => {
  console.error('[RENDERER]', JSON.stringify(payload, null, 2));
  return { ok: true };
});
ipcMain.handle('log:info', async (_e, msg) => {
  console.log('[RENDERER]', msg);
  return { ok: true };
});

// ---------- Image analysis (dominant color, phash for dedup) ----------
ipcMain.handle('image:dominantColor', async (_e, filePath) => {
  if (!sharp) return null;
  try {
    const { dominant } = await sharp(filePath, { failOn: 'none' })
      .resize(64, 64, { fit: 'inside' })
      .stats();
    return dominant;
  } catch { return null; }
});

// dHash perceptual hash (8x8 grid of brightness diffs => 64-bit hash)
ipcMain.handle('image:phash', async (_e, filePath) => {
  if (!sharp) return null;
  try {
    const buf = await sharp(filePath, { failOn: 'none' })
      .resize(9, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();
    let hash = '';
    for (let row = 0; row < 8; row++) {
      let bits = 0n;
      for (let col = 0; col < 8; col++) {
        const left = buf[row * 9 + col];
        const right = buf[row * 9 + col + 1];
        bits = (bits << 1n) | (left < right ? 1n : 0n);
      }
      hash += bits.toString(16).padStart(2, '0');
    }
    return hash;
  } catch { return null; }
});

// ---------- Batch export ----------
ipcMain.handle('batch:export', async (event, files, opts) => {
  if (!sharp) throw new Error('sharp non disponible');
  const r = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choisir le dossier de destination',
  });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  const outDir = r.filePaths[0];
  const ext = (opts.format || 'jpg').toLowerCase();
  const sender = event.sender;
  let done = 0, failed = 0;
  const results = [];

  for (const file of files) {
    try {
      const baseName = path.basename(file.path, path.extname(file.path));
      const outPath = path.join(outDir, `${opts.prefix || ''}${baseName}${opts.suffix || ''}.${ext}`);
      let pipe = sharp(file.path, { failOn: 'none' }).rotate();
      if (opts.maxSize) pipe = pipe.resize(opts.maxSize, opts.maxSize, { fit: 'inside', withoutEnlargement: true });
      if (ext === 'jpg' || ext === 'jpeg') pipe = pipe.jpeg({ quality: opts.quality || 90, mozjpeg: true });
      else if (ext === 'png') pipe = pipe.png({ compressionLevel: 9 });
      else if (ext === 'webp') pipe = pipe.webp({ quality: opts.quality || 90 });
      else if (ext === 'avif') pipe = pipe.avif({ quality: opts.quality || 70 });
      await pipe.toFile(outPath);
      done++;
      results.push({ ok: true, source: file.path, dest: outPath });
    } catch (e) {
      failed++;
      results.push({ ok: false, source: file.path, error: e.message });
    }
    sender.send('batch:progress', { done: done + failed, total: files.length, success: done, failed });
  }
  return { ok: true, dir: outDir, done, failed, results };
});

// ---------- App state (last folder, sidebar collapsed, thumb size, etc.) ----------
ipcMain.handle('state:get', async () => readJsonSync(STATE_FILE, {}));
ipcMain.handle('state:set', async (_e, patch) => {
  const cur = readJsonSync(STATE_FILE, {});
  Object.assign(cur, patch);
  writeJsonSync(STATE_FILE, cur);
  return { ok: true };
});

// ---------- Recent folders ----------
ipcMain.handle('recent:get', async () => readJsonSync(RECENT_FILE, []));
ipcMain.handle('recent:add', async (_e, dir) => {
  let list = readJsonSync(RECENT_FILE, []);
  list = list.filter(d => d.path !== dir);
  list.unshift({ path: dir, name: path.basename(dir) || dir, ts: Date.now() });
  list = list.slice(0, 12);
  writeJsonSync(RECENT_FILE, list);
  return list;
});
ipcMain.handle('recent:clear', async () => {
  writeJsonSync(RECENT_FILE, []);
  return [];
});

// ---------- Read clipboard text helper for "copy path" ----------
const { clipboard } = require('electron');
ipcMain.handle('clipboard:writeText', async (_e, text) => {
  clipboard.writeText(String(text || ''));
  return { ok: true };
});
