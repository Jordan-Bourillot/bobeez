import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { M } from '../mascot.js';

export default function TriageMode({ files, startIndex = 0, onClose, onTrash, onRate }) {
  const [idx, setIdx] = useState(startIndex);
  const [src, setSrc] = useState(null);
  const [reaction, setReaction] = useState(null); // {pose, side, key}
  const [history, setHistory] = useState([]); // [{action, fileIdx, prevRating}]
  const [exiting, setExiting] = useState(null); // 'left'|'right'|'up'

  const file = files[idx];

  useEffect(() => {
    if (!file) return;
    let alive = true;
    window.bobeez.fullUrl(file.path).then(u => { if (alive) setSrc(u); });
  }, [file?.path]);

  const next = () => {
    if (idx < files.length - 1) {
      setExiting(null);
      setIdx(idx + 1);
    } else {
      setReaction({ pose: 'happy', side: 'center', key: Date.now(), final: true });
    }
  };

  const flash = (pose, side = 'right') => {
    setReaction({ pose, side, key: Date.now() });
    setTimeout(() => setReaction(null), 800);
  };

  const keep = () => {
    setExiting('right');
    flash('happy', 'right');
    setHistory(h => [...h, { action: 'keep', fileIdx: idx }]);
    setTimeout(next, 240);
  };

  const trash = async () => {
    setExiting('left');
    flash('shocked2', 'left');
    setHistory(h => [...h, { action: 'trash', fileIdx: idx, file }]);
    await onTrash?.(file);
    setTimeout(next, 240);
  };

  const rate = (n) => {
    setExiting('up');
    flash(n >= 4 ? 'happy' : 'pensive', 'right');
    setHistory(h => [...h, { action: 'rate', fileIdx: idx, rating: n }]);
    onRate?.(file, n);
    setTimeout(next, 240);
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setIdx(last.fileIdx);
    setExiting(null);
    flash('pensive', 'center');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT') return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'k') { e.preventDefault(); keep(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key.toLowerCase() === 'd') { e.preventDefault(); trash(); }
      else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'u') { e.preventDefault(); undo(); }
      else if (e.key >= '1' && e.key <= '5') { e.preventDefault(); rate(parseInt(e.key)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, history, file]);

  if (!file) return (
    <div className="triage">
      <div className="triage-done">
        <img src={M.happy} alt="" />
        <h2>Triage terminé !</h2>
        <p>Tu as parcouru toutes les photos.</p>
        <button className="btn primary" onClick={onClose}>Retour à la grille</button>
      </div>
    </div>
  );

  const stats = history.reduce((acc, h) => {
    acc[h.action] = (acc[h.action] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="triage">
      <div className="triage-header">
        <button className="icon-btn" onClick={onClose} title="Fermer (Esc)">
          <Icon name="close" />
        </button>
        <div className="triage-progress">
          <div className="triage-bar"><div className="triage-bar-fill" style={{ width: `${(idx / files.length) * 100}%` }} /></div>
          <span className="triage-counter">{idx + 1} / {files.length}</span>
        </div>
        <div className="triage-stats">
          <span className="ts-keep">✓ {stats.keep || 0}</span>
          <span className="ts-trash">✕ {stats.trash || 0}</span>
        </div>
      </div>

      <div className="triage-stage">
        <div className={'triage-photo ' + (exiting ? 'exit-' + exiting : '')}>
          {src && <img src={src} alt={file.name} draggable={false} />}
          <div className="triage-name">{file.name}</div>
        </div>

        {reaction && (
          <div className={'triage-reaction reaction-' + reaction.side} key={reaction.key}>
            <img src={M[reaction.pose]} alt="" />
          </div>
        )}
      </div>

      <div className="triage-actions">
        <button className="triage-btn trash" onClick={trash} title="Corbeille (← ou D)">
          <Icon name="trash" size={28} />
          <span>Corbeille</span>
          <kbd>←</kbd>
        </button>
        <div className="triage-rate">
          {[1,2,3,4,5].map(n => (
            <button key={n} className="rate-btn" onClick={() => rate(n)} title={`Noter ${n} étoile${n>1?'s':''} (${n})`}>
              <Icon name="star" size={20} fill="currentColor" />
              <span>{n}</span>
            </button>
          ))}
        </div>
        <button className="triage-btn keep" onClick={keep} title="Garder (→ ou K)">
          <Icon name="check" size={28} />
          <span>Garder</span>
          <kbd>→</kbd>
        </button>
      </div>

      <div className="triage-undo">
        <button className="btn ghost" onClick={undo} disabled={!history.length}>
          <Icon name="back" size={14} /> Annuler la dernière action <kbd>↑</kbd>
        </button>
      </div>
    </div>
  );
}
