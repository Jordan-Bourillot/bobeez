// Theme management. Persists to state.theme via main process.
// Values: 'dark' | 'light' | 'auto'.
// 'auto' follows the OS preference via prefers-color-scheme media query.

const VALID = new Set(['dark', 'light', 'auto']);
const STORAGE_KEY = 'bobeez.theme.cache';
const listeners = new Set();

export function applyTheme(theme) {
  if (!VALID.has(theme)) theme = 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  for (const l of listeners) l(theme);
}

export function getCurrentTheme() {
  return document.documentElement.dataset.theme || 'dark';
}

export function getCachedTheme() {
  try { return localStorage.getItem(STORAGE_KEY) || 'dark'; }
  catch { return 'dark'; }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Apply cached theme synchronously, before React renders, to avoid a
// flash of dark-then-light on first paint after a fresh launch.
export function bootTheme() {
  applyTheme(getCachedTheme());
}
