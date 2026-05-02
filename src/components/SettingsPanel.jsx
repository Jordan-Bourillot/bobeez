import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { M } from '../mascot.js';
import { toastSuccess, toastInfo, toastError } from '../lib/toast.js';
import { useUpdateStatus } from './UpdateBanner.jsx';

const SECTIONS = [
  { id: 'display', label: 'Affichage', icon: 'grid' },
  { id: 'behavior', label: 'Comportement', icon: 'settings' },
  { id: 'updates', label: 'Mises à jour', icon: 'download' },
  { id: 'beta', label: 'Programme bêta', icon: 'help' },
  { id: 'data', label: 'Données', icon: 'folder' },
  { id: 'about', label: 'À propos', icon: 'info' },
];

function fmtBytes(bps) {
  if (bps < 1024) return `${bps} o`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} ko`;
  return `${(bps / 1024 / 1024).toFixed(2)} Mo`;
}

export default function SettingsPanel({ onClose }) {
  const [section, setSection] = useState('display');
  const [state, setState] = useState({});
  const [appVer, setAppVer] = useState('');
  const updateStatus = useUpdateStatus();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    window.bobeez.getState().then(setState);
    window.bobeez.version().then(setAppVer);
  }, []);

  const update = async (patch) => {
    const next = { ...state, ...patch };
    setState(next);
    await window.bobeez.setState(patch);
  };

  const checkUpdate = async () => {
    setChecking(true);
    try {
      await window.bobeez.updaterCheck();
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  const toggleBeta = async (beta) => {
    await update({ betaChannel: beta });
    await window.bobeez.updaterSetChannel(beta);
    if (beta) {
      toastSuccess('Canal bêta activé. Vérification d\'une nouvelle version…');
    } else {
      toastInfo('Canal bêta désactivé. Tu reviendras sur la version stable à la prochaine update.');
    }
  };

  const clearRecent = async () => {
    await window.bobeez.clearRecent();
    toastInfo('Historique des dossiers récents effacé');
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="settings-modal">
        <div className="settings-header">
          <img src={M.notebook} alt="" className="settings-mascot" />
          <h2>Paramètres</h2>
          <button className="icon-btn" onClick={onClose} title="Fermer (Esc)"><Icon name="close" /></button>
        </div>

        <div className="settings-body">
          <nav className="settings-nav">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                className={'settings-nav-btn ' + (section === s.id ? 'active' : '')}
                onClick={() => setSection(s.id)}
              >
                <Icon name={s.icon} size={14} />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="settings-content">
            {section === 'display' && (
              <>
                <h3>Affichage</h3>
                <div className="settings-row">
                  <span>Taille des miniatures par défaut</span>
                  <input type="range" min={80} max={400} value={state.thumbSize || 180} onChange={e => update({ thumbSize: parseInt(e.target.value) })} />
                  <span className="val">{state.thumbSize || 180}px</span>
                </div>
                <div className="settings-row">
                  <span>Tri par défaut</span>
                  <select value={state.sortBy || 'name'} onChange={e => update({ sortBy: e.target.value })}>
                    <option value="name">Nom A→Z</option>
                    <option value="name-desc">Nom Z→A</option>
                    <option value="date">Date ↓</option>
                    <option value="date-asc">Date ↑</option>
                    <option value="size">Taille ↓</option>
                    <option value="rating">Note ↓</option>
                  </select>
                </div>
              </>
            )}

            {section === 'behavior' && (
              <>
                <h3>Comportement</h3>
                <Toggle
                  checked={!!state.skipWelcome}
                  onChange={v => update({ skipWelcome: v })}
                  label="Ne plus afficher l'écran de bienvenue"
                />
                <Toggle
                  checked={!!state.disableMascotReactions}
                  onChange={v => update({ disableMascotReactions: v })}
                  label="Désactiver les réactions de la mascotte"
                />
                <Toggle
                  checked={!!state.hoverPreviewDisabled}
                  onChange={v => update({ hoverPreviewDisabled: v })}
                  label="Désactiver l'aperçu au survol"
                />
              </>
            )}

            {section === 'updates' && (
              <>
                <h3>Mises à jour</h3>
                <p className="settings-hint">
                  Bobeez vérifie automatiquement les nouvelles versions au démarrage et les télécharge en arrière-plan.
                </p>

                <div className="update-status-card">
                  <UpdateStatusBlock status={updateStatus} appVer={appVer} />
                </div>

                <div className="settings-actions">
                  <button className="btn" onClick={checkUpdate} disabled={checking || updateStatus.phase === 'checking' || updateStatus.phase === 'downloading'}>
                    <Icon name="refresh" size={14} className={(checking || updateStatus.phase === 'checking') ? 'spin' : ''} />
                    Vérifier maintenant
                  </button>
                  {updateStatus.phase === 'ready' && (
                    <button className="btn primary" onClick={() => window.bobeez.updaterInstall()}>
                      <Icon name="download" size={14} /> Installer et redémarrer
                    </button>
                  )}
                </div>

                {updateStatus.phase === 'available' && updateStatus.releaseNotes && (
                  <div className="release-notes">
                    <h4>Notes de version {updateStatus.nextVersion}</h4>
                    <pre>{updateStatus.releaseNotes}</pre>
                  </div>
                )}
              </>
            )}

            {section === 'beta' && (
              <>
                <h3>Programme bêta</h3>
                <p className="settings-hint">
                  Reçois les nouvelles versions <strong>en avant-première</strong>. Elles peuvent contenir des bugs —
                  tes retours nous aident à les corriger.
                </p>

                <Toggle
                  checked={!!state.betaChannel}
                  onChange={toggleBeta}
                  label="Activer le canal bêta"
                  description="Auto-update se mettra à jour vers les pré-versions (suffixées -beta)."
                />

                <div className="settings-actions">
                  <button
                    className="btn ghost"
                    onClick={() => {
                      const url = 'mailto:contact@triskell-studio.fr?subject=' + encodeURIComponent('Bobeez bêta — Mon retour');
                      window.bobeez.openExternal(url);
                    }}
                  >
                    <Icon name="external" size={14} /> Envoyer un retour
                  </button>
                </div>
              </>
            )}

            {section === 'data' && (
              <>
                <h3>Données</h3>
                <p className="settings-hint">
                  Bobeez stocke les vignettes, les sidecars (notes, étoiles) et tes préférences localement.
                </p>
                <div className="settings-actions">
                  <button className="btn ghost" onClick={clearRecent}>Effacer l'historique des dossiers récents</button>
                </div>
              </>
            )}

            {section === 'about' && (
              <>
                <h3>À propos</h3>
                <div className="about-card">
                  <img src={M.base} alt="" className="about-mascot" />
                  <div>
                    <h4>Bobeez</h4>
                    <p className="about-version">Version {appVer || '0.0.0'}</p>
                    <p className="settings-hint">Gestionnaire d'images moderne, rapide, local-first.</p>
                    <p className="settings-hint">Construit avec Electron, React, Sharp et electron-updater.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="settings-toggle">
      <div className="toggle-text">
        <span>{label}</span>
        {description && <span className="toggle-desc">{description}</span>}
      </div>
      <button
        type="button"
        className={'toggle-switch ' + (checked ? 'on' : '')}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="toggle-knob" />
      </button>
    </label>
  );
}

function UpdateStatusBlock({ status, appVer }) {
  const phase = status.phase;
  if (phase === 'idle' || phase === 'not-available') {
    return (
      <div className="us-row">
        <Icon name="check" size={16} className="us-icon ok" />
        <div>
          <strong>Vous êtes à jour</strong>
          <span className="us-sub">Version {appVer}</span>
        </div>
      </div>
    );
  }
  if (phase === 'checking') {
    return (
      <div className="us-row">
        <Icon name="refresh" size={16} className="us-icon spin" />
        <div>
          <strong>Recherche d'une mise à jour…</strong>
          <span className="us-sub">Version actuelle : {appVer}</span>
        </div>
      </div>
    );
  }
  if (phase === 'available') {
    return (
      <div className="us-row">
        <Icon name="download" size={16} className="us-icon accent" />
        <div>
          <strong>Mise à jour {status.nextVersion} disponible</strong>
          <span className="us-sub">Téléchargement automatique…</span>
        </div>
      </div>
    );
  }
  if (phase === 'downloading') {
    return (
      <div className="us-row downloading">
        <Icon name="download" size={16} className="us-icon accent spin" />
        <div className="us-grow">
          <strong>Téléchargement de {status.nextVersion}</strong>
          <div className="us-bar"><div className="us-bar-fill" style={{ width: `${status.percent || 0}%` }} /></div>
          <span className="us-sub">{status.percent || 0}% · {fmtBytes(status.bytesPerSecond || 0)}/s</span>
        </div>
      </div>
    );
  }
  if (phase === 'ready') {
    return (
      <div className="us-row ready">
        <Icon name="check" size={16} className="us-icon ok" />
        <div>
          <strong>Mise à jour {status.nextVersion} prête</strong>
          <span className="us-sub">Cliquez sur "Installer et redémarrer" pour appliquer</span>
        </div>
      </div>
    );
  }
  if (phase === 'error') {
    return (
      <div className="us-row error">
        <Icon name="close" size={16} className="us-icon danger" />
        <div>
          <strong>Erreur</strong>
          <span className="us-sub">{status.message}</span>
        </div>
      </div>
    );
  }
  return null;
}
