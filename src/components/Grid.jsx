import React, { useEffect, useRef, useState } from 'react';
import { M } from '../mascot.js';
import Icon from './Icon.jsx';

function Thumb({ file, idx, size, selected, onClick, onDoubleClick, onSetRating, onContextMenu, onHover, onLeave }) {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (en.isIntersecting) { setVisible(true); io.disconnect(); }
      }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    window.bobeez.thumbnail(file.path, file.mtime, Math.max(256, size * 2))
      .then(r => { if (alive) setSrc(r.url); })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, [visible, file.path, file.mtime, size]);

  return (
    <div
      ref={ref}
      data-idx={idx}
      className={'thumb ' + (selected ? 'selected' : '')}
      style={{ width: size, height: size + 50 }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => onContextMenu(e, idx)}
      onMouseEnter={() => onHover?.(file, ref.current)}
      onMouseLeave={() => onLeave?.()}
      title={file.name}
    >
      <div className="thumb-img" style={{ height: size }}>
        {err ? <div className="thumb-err"><Icon name="close" size={20} /></div> :
         src ? <img src={src} alt={file.name} loading="lazy" draggable={false} /> :
         <div className="thumb-skel" />}
        {selected && (
          <div className="thumb-check">
            <Icon name="check" size={14} />
          </div>
        )}
        {(file.rating || 0) > 0 && (
          <div className="thumb-rating-badge">
            <Icon name="star" size={10} fill="currentColor" stroke="none" /> {file.rating}
          </div>
        )}
      </div>
      <div className="thumb-meta">
        <div className="thumb-name">{file.name}</div>
        <div className="thumb-stars">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              className={'star-btn ' + ((file.rating || 0) >= i ? 'on' : '')}
              onClick={e => { e.stopPropagation(); onSetRating(i === (file.rating || 0) ? 0 : i); }}
              title={`Noter ${i} étoile${i>1?'s':''}`}
            >
              <Icon name="star" size={11} fill="currentColor" stroke="none" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Grid({ files, selected, onSelect, onOpen, thumbSize, loading, error, onSetRating, onContextMenu, onHover, onLeave }) {
  if (error) return (
    <div className="empty mascot-empty">
      <img src={M.shocked2} alt="" className="mascot-big" />
      <h3>Erreur</h3>
      <p>{error}</p>
    </div>
  );
  if (loading) return (
    <div className="empty mascot-empty">
      <img src={M.binoculars} alt="" className="mascot-big spinning" />
      <p>Chargement…</p>
    </div>
  );
  if (!files.length) return (
    <div className="empty mascot-empty">
      <img src={M.pensive} alt="" className="mascot-big" />
      <h3>Aucune image ici</h3>
      <p>Ouvre un autre dossier ou dépose-le dans la fenêtre.</p>
    </div>
  );

  return (
    <div
      className="grid"
      style={{ '--thumb-size': thumbSize + 'px' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {files.map((f, i) => (
        <Thumb
          key={f.path}
          file={f}
          idx={i}
          size={thumbSize}
          selected={selected.has(i)}
          onClick={(e) => onSelect(i, e)}
          onDoubleClick={() => onOpen(i)}
          onSetRating={(r) => onSetRating(i, r)}
          onContextMenu={onContextMenu}
          onHover={onHover}
          onLeave={onLeave}
        />
      ))}
    </div>
  );
}
