// Tiny event-based toast store. No deps.
const listeners = new Set();
let toasts = [];
let nextId = 1;

export function subscribe(fn) {
  listeners.add(fn);
  fn(toasts);
  return () => listeners.delete(fn);
}

function emit() {
  for (const l of listeners) l(toasts);
}

export function toast(msg, opts = {}) {
  const id = nextId++;
  const t = {
    id,
    message: msg,
    type: opts.type || 'info', // info | success | error | warn
    duration: opts.duration ?? 2800,
    icon: opts.icon || null,
    action: opts.action || null,
  };
  toasts = [...toasts, t];
  emit();
  if (t.duration > 0) setTimeout(() => dismiss(id), t.duration);
  return id;
}

export function dismiss(id) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export const toastSuccess = (m, o) => toast(m, { ...o, type: 'success' });
export const toastError = (m, o) => toast(m, { ...o, type: 'error', duration: 5000 });
export const toastWarn = (m, o) => toast(m, { ...o, type: 'warn' });
export const toastInfo = (m, o) => toast(m, { ...o, type: 'info' });
