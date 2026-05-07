// Forward renderer errors to main process so they show up in console logs.
function send(payload) {
  try { window.bobeez?.logError?.(payload); } catch {}
}

export function installErrorReporting() {
  window.addEventListener('error', (e) => {
    send({
      kind: 'window.error',
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack,
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    send({
      kind: 'unhandledrejection',
      message: e.reason?.message || String(e.reason),
      stack: e.reason?.stack,
    });
  });

  // Also forward console.error so we see all errors in main logs
  const origErr = console.error;
  console.error = (...args) => {
    origErr.apply(console, args);
    try {
      send({ kind: 'console.error', message: args.map(a => a?.stack || String(a)).join(' ') });
    } catch {}
  };
}
