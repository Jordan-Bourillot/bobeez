import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

const SESSION_DISMISS_KEY = 'bobeez.update-banner.dismissed';

export function useUpdateStatus() {
  const [status, setStatus] = useState({ phase: 'idle', currentVersion: '0.0.0' });
  useEffect(() => {
    let off;
    (async () => {
      try {
        const initial = await window.bobeez.updaterStatus();
        if (initial) setStatus(initial);
      } catch {}
      off = window.bobeez.onUpdaterStatus?.((s) => setStatus(s));
    })();
    return () => { try { off?.(); } catch {} };
  }, []);
  return status;
}

function fmtBytes(bps) {
  if (bps < 1024) return `${bps} o`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} ko`;
  return `${(bps / 1024 / 1024).toFixed(2)} Mo`;
}

export default function UpdateBanner() {
  const status = useUpdateStatus();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;
  if (status.phase !== 'available' && status.phase !== 'downloading' && status.phase !== 'ready') {
    return null;
  }

  const dismiss = () => {
    try { sessionStorage.setItem(SESSION_DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  };
  const install = () => window.bobeez.updaterInstall();

  return (
    <div className="update-banner" role="status">
      {status.phase === 'available' && (
        <>
          <Icon name="download" size={14} className="ub-icon pulse" />
          <span className="ub-text">
            Mise à jour <strong>{status.nextVersion}</strong> disponible
          </span>
          <span className="ub-muted">— téléchargement en cours…</span>
        </>
      )}
      {status.phase === 'downloading' && (
        <>
          <Icon name="refresh" size={14} className="ub-icon spin" />
          <span className="ub-text">Téléchargement {status.nextVersion}…</span>
          <div className="ub-bar">
            <div className="ub-bar-fill" style={{ width: `${status.percent || 0}%` }} />
          </div>
          <span className="ub-muted">
            {status.percent || 0}% · {fmtBytes(status.bytesPerSecond || 0)}/s
          </span>
        </>
      )}
      {status.phase === 'ready' && (
        <>
          <Icon name="check" size={14} className="ub-icon" />
          <span className="ub-text">
            Mise à jour <strong>{status.nextVersion}</strong> prête à installer
          </span>
          <button className="ub-install-btn" onClick={install}>Installer maintenant</button>
        </>
      )}
      <button className="ub-close" onClick={dismiss} title="Masquer pour cette session">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
