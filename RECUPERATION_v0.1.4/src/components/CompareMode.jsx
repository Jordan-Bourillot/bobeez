import React, { useEffect, useState, useRef } from 'react';
import Icon from './Icon.jsx';
import { M } from '../mascot.js';

export default function CompareMode({ files, onClose }) {
  const [mode, setMode] = useState('split'); // split | overlay
  const [splitPos, setSplitPos] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [srcA, setSrcA] = useState(null);
  const [srcB, setSrcB] = useState(null);
  const stageRef = useRef(null);
  const dragRef = useRef(false);

  const fileA = files[0];
  const fileB = files[1];

  useEffect(() => {
    if (fileA) window.bobeez.fullUrl(fileA.path).then(setSrcA);
    if (fileB) window.bobeez.fullUrl(fileB.path).then(setSrcB);
  }, [fileA?.path, fileB?.path]);

  useEffect(() => {
    const onUp = () => { dragRef.current = false; };
    const onMove = (e) => {
      if (!dragRef.current || !stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      setSplitPos(Math.max(0, Math.min(100, pct)));
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  if (!fileA || !fileB) {
    return (
      <div className="compare-empty">
        <img src={M.pensive} alt="" />
        <h3>Sélectionne 2 photos pour comparer</h3>
        <p>Clic sur la 1ʳᵉ, puis Ctrl+clic sur la 2ᵉ.</p>
        <button className="btn primary" onClick={onClose}>Fermer</button>
      </div>
    );
  }

  return (
    <div className="compare-mode">
      <div className="compare-header">
        <button className="icon-btn" onClick={onClose} title="Fermer (Esc)"><Icon name="close" /></button>
        <h2>Comparer</h2>
        <div className="spacer" />
        <div className="compare-tabs">
          <button className={'btn ' + (mode === 'split' ? 'primary' : 'ghost')} onClick={() => setMode('split')}>
            <Icon name="compare" size={14} /> Split
          </button>
          <button className={'btn ' + (mode === 'overlay' ? 'primary' : 'ghost')} onClick={() => setMode('overlay')}>
            <Icon name="fit" size={14} /> Superposé
          </button>
        </div>
      </div>

      <div className="compare-stage" ref={stageRef}>
        {mode === 'split' && (
          <div className="compare-split">
            <div className="cs-left" style={{ width: splitPos + '%' }}>
              {srcA && <img src={srcA} alt="" draggable={false} />}
              <div className="cs-label cs-left-label">{fileA.name}</div>
            </div>
            <div className="cs-right" style={{ width: (100 - splitPos) + '%' }}>
              {srcB && <img src={srcB} alt="" draggable={false} style={{ marginLeft: -100 / (100 - splitPos) * 100 + '%' }} />}
              <div className="cs-label cs-right-label">{fileB.name}</div>
            </div>
            <div
              className="compare-divider"
              style={{ left: splitPos + '%' }}
              onMouseDown={() => { dragRef.current = true; }}
            >
              <div className="divider-handle">⇆</div>
            </div>
          </div>
        )}
        {mode === 'overlay' && (
          <div className="compare-overlay">
            {srcA && <img className="ov-base" src={srcA} alt="" draggable={false} />}
            {srcB && <img className="ov-top" src={srcB} alt="" draggable={false} style={{ opacity: overlayOpacity }} />}
            <div className="cs-label cs-left-label">A : {fileA.name}</div>
            <div className="cs-label cs-right-label">B : {fileB.name}</div>
          </div>
        )}
      </div>

      <div className="compare-controls">
        {mode === 'overlay' ? (
          <>
            <span>A</span>
            <input
              type="range" min={0} max={1} step={0.01} value={overlayOpacity}
              onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span>B</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>Glisser la barre verticale pour comparer · {Math.round(splitPos)}%</span>
          </>
        )}
      </div>
    </div>
  );
}
