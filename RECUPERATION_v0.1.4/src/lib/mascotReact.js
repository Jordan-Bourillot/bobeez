// Floating mascot reactions on actions.
const listeners = new Set();
let nextId = 1;

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function react(pose, opts = {}) {
  const id = nextId++;
  const ev = {
    id,
    pose,
    text: opts.text,
    duration: opts.duration ?? 1400,
    x: opts.x,
    y: opts.y,
  };
  for (const l of listeners) l({ type: 'add', ev });
  setTimeout(() => {
    for (const l of listeners) l({ type: 'remove', id });
  }, ev.duration);
}

// Convenience helpers
export const reactHappy = (text, opts) => react('happy', { ...opts, text });
export const reactShocked = (text, opts) => react('shocked2', { ...opts, text });
export const reactPensive = (text, opts) => react('pensive', { ...opts, text });
export const reactProud = (text, opts) => react('base', { ...opts, text });
