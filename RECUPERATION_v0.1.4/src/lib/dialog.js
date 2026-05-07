// Promise-based modal dialogs. Replaces native prompt/confirm.
const listeners = new Set();
let current = null;

export function subscribe(fn) {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}

function emit() { for (const l of listeners) l(current); }

export function confirm(message, opts = {}) {
  return new Promise(resolve => {
    current = {
      type: 'confirm',
      title: opts.title || 'Confirmation',
      message,
      okLabel: opts.okLabel || 'Confirmer',
      cancelLabel: opts.cancelLabel || 'Annuler',
      danger: !!opts.danger,
      icon: opts.icon || (opts.danger ? 'shocked' : 'pensive'),
      resolve: (ok) => { current = null; emit(); resolve(ok); },
    };
    emit();
  });
}

export function prompt(message, opts = {}) {
  return new Promise(resolve => {
    current = {
      type: 'prompt',
      title: opts.title || 'Entrée',
      message,
      defaultValue: opts.defaultValue || '',
      okLabel: opts.okLabel || 'OK',
      cancelLabel: opts.cancelLabel || 'Annuler',
      icon: opts.icon || 'pensive',
      validate: opts.validate,
      resolve: (val) => { current = null; emit(); resolve(val); },
    };
    emit();
  });
}
