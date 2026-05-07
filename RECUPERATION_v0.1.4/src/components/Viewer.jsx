import React, { useEffect, useRef, useState, useCallback } from 'react';
import { M } from '../mascot.js';

export default function Viewer({ files, index, onIndex, onClose }) {
  const file = files[index];
  const [src, setSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [slideshow, setSlideshow] = useState(false);

  useEffect(() => {
    if (!file) return;
    let alive = true;
    window.bobeez.fullUrl(file.path).then(u => { if (alive) setSrc(u); });
    setZoom(1); setRot(0); setPan({ x: 0, y: 0 });
  }, [file?.path]);

  const next = useCallback(() => {
    if (index < files.length - 1) onIndex(index + 1);
  }, [index, files.length, onIndex]);

  const prev = useCallback(() => {
    if (index > 0) onIndex(index - 1);
  }, [index, onIndex]);

  // slideshow
  useEffect(() => {
    if (!slideshow) return;
    const id = setInterval(() => {
      onIndex((i) => {
        const cur = i ?? 0;
        return cur < files.length - 1 ? cur + 1 : 0;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [slideshow, files.length, onIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      else if (e.key === 'Home') onIndex(0);
      else if (e.key === 'End') onIndex(files.length - 1);
      else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(8, z * 1.2));
      else if (e.key === '-') setZoom(z => Math.max(0.1, z / 1.2));
      else if (e.key === '0') { setZoom(1); setPan({ x:0, y:0 }); setRot(0); }
      else if (e.key.toLowerCase() === 'r') setRot(r => (r + 90) % 360);
      else if (e.key.toLowerCase() === 'l') setRot(r => (r + 270) % 360);
      else if (e.key === 'F11' || e.key.toLowerCase() === 'f') setFullscreen(v => !v);
      else if (e.key === ' ') { e.preventDefault(); setSlideshow(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onIndex, files.length]);

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.max(0.1, Math.min(8, z * delta)));
  };

  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onMouseUp = () => { dragRef.current = null; };

  if (!file) return (
    <div className="empty mascot-empty">
      <img src={M.binoculars} alt="" className="mascot-big" />
      <h3>Rien à afficher</h3>
      <p>Sélectionne une image dans la grille puis double-clique pour l'ouvrir.</p>
    </div>
  );

  return (
    <div className={'viewer ' + (fullscreen ? 'fullscreen' : '')}>
      <div className="viewer-toolbar">
        <button className="icon-btn" onClick={prev} disabled={index === 0} title="Précédent (←)">‹</button>
        <span className="viewer-counter">{index + 1} / {files.length}</span>
        <button className="icon-btn" onClick={next} disabled={index >= files.length - 1} title="Suivant (→)">›</button>
        <div className="spacer" />
        <span className="viewer-name">{file.name}</span>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.1, z / 1.2))} title="Zoom arrière (-)">−</button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="icon-btn" onClick={() => setZoom(z => Math.min(8, z * 1.2))} title="Zoom avant (+)">+</button>
        <button className="icon-btn" onClick={() => { setZoom(1); setPan({x:0,y:0}); setRot(0); }} title="Adapter (0)">⊡</button>
        <button className="icon-btn" onClick={() => setRot(r => (r + 270) % 360)} title="Rot. gauche (L)">⟲</button>
        <button className="icon-btn" onClick={() => setRot(r => (r + 90) % 360)} title="Rot. droite (R)">⟳</button>
        <button
          className={'icon-btn ' + (slideshow ? 'active' : '')}
          onClick={() => setSlideshow(v => !v)}
          title="Diaporama (Espace)"
        >▶</button>
        <button className="icon-btn" onClick={() => setFullscreen(v => !v)} title="Plein écran (F)">⛶</button>
      </div>
      <div
        className="viewer-stage"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: zoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'default' }}
      >
        {src && (
          <img
            src={src}
            alt={file.name}
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rot}deg)`,
              transformOrigin: 'center',
              transition: dragRef.current ? 'none' : 'transform 0.15s ease',
            }}
          />
        )}
      </div>
      <div className="viewer-filmstrip">
        {files.slice(Math.max(0, index - 10), index + 11).map((f, i) => {
          const realIdx = Math.max(0, index - 10) + i;
          return (
            <FilmstripThumb
              key={f.path}
              file={f}
              active={realIdx === index}
              onClick={() => onIndex(realIdx)}
            />
          );
        })}
      </div>
    </div>
  );
}

function FilmstripThumb({ file, active, onClick }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    window.bobeez.thumbnail(file.path, file.mtime, 128).then(r => { if (alive) setSrc(r.url); });
    return () => { alive = false; };
  }, [file.path]);
  return (
    <div className={'film-thumb ' + (active ? 'active' : '')} onClick={onClick} title={file.name}>
      {src ? <img src={src} alt="" draggable={false} /> : <div className="thumb-skel" />}
    </div>
  );
}
