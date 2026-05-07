import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { M } from '../mascot.js';
import { toastSuccess, toastError } from '../lib/toast.js';

export default function BatchExport({ files, onClose }) {
  const [format, setFormat] = useState('jpg');
  const [quality, setQuality] = useState(90);
  const [maxSize, setMaxSize] = useState(0);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [progress, setProgress] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const off = window.bobeez.onBatchProgress((p) => setProgress(p));
    return off;
  }, []);

  const start = async () => {
    if (running) return;
    setRunning(true);
    setProgress({ done: 0, total: files.length, success: 0, failed: 0 });
    try {
      const r = await window.bobeez.batchExport(files, { format, quality, maxSize: maxSize || undefined, prefix, suffix });
      if (r.canceled) {
        toastError('Export annulé');
      } else if (r.ok) {
        toastSuccess(`${r.done} photo${r.done > 1 ? 's' : ''} exportée${r.done > 1 ? 's' : ''} dans ${r.dir}`, {
          action: { label: 'Ouvrir', onClick: () => window.bobeez.reveal(r.dir + '\\.') },
          duration: 6000,
        });
        onClose();
      }
    } catch (e) {
      toastError('Erreur : ' + e.message);
    }
    setRunning(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !running) onClose(); }}>
      <div className="modal modal-export">
        <div className="modal-mascot">
          <img src={M.photos} alt="" />
        </div>
        <div className="modal-body">
          <h3>Exporter {files.length} photo{files.length > 1 ? 's' : ''}</h3>
          <p className="hint">Crée des copies dans un dossier de destination, sans toucher aux originaux.</p>

          <div className="export-row">
            <label>Format</label>
            <div className="seg">
              {['jpg', 'png', 'webp', 'avif'].map(f => (
                <button
                  key={f}
                  className={'btn ' + (format === f ? 'primary' : 'ghost')}
                  onClick={() => setFormat(f)}
                  disabled={running}
                >{f.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {format !== 'png' && (
            <div className="export-row">
              <label>Qualité</label>
              <input type="range" min={50} max={100} value={quality} onChange={e => setQuality(parseInt(e.target.value))} disabled={running} />
              <span className="val">{quality}%</span>
            </div>
          )}

          <div className="export-row">
            <label>Taille max</label>
            <select value={maxSize} onChange={e => setMaxSize(parseInt(e.target.value))} disabled={running}>
              <option value={0}>Original</option>
              <option value={4096}>4096 px</option>
              <option value={2048}>2048 px (Web HD)</option>
              <option value={1920}>1920 px (Full HD)</option>
              <option value={1280}>1280 px</option>
              <option value={800}>800 px</option>
            </select>
          </div>

          <div className="export-row">
            <label>Préfixe</label>
            <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="ex: web_" disabled={running} />
          </div>
          <div className="export-row">
            <label>Suffixe</label>
            <input type="text" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="ex: _retouché" disabled={running} />
          </div>

          {progress && (
            <div className="export-progress">
              <div className="export-bar"><div className="export-bar-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
              <div className="export-stats">
                {progress.done} / {progress.total} · ✓ {progress.success} · ✕ {progress.failed}
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose} disabled={running}>Annuler</button>
          <button className="btn primary" onClick={start} disabled={running}>
            {running ? 'Export en cours…' : <><Icon name="download" size={14} /> Choisir le dossier et exporter</>}
          </button>
        </div>
      </div>
    </div>
  );
}
