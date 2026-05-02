import React, { useEffect, useState } from 'react';

export default function HoverPreview({ file, anchor }) {
  const [src, setSrc] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0, side: 'right' });

  useEffect(() => {
    if (!file) return;
    let alive = true;
    window.bobeez.thumbnail(file.path, file.mtime, 1024).then(r => {
      if (alive) setSrc(r.url);
    });
    return () => { alive = false; };
  }, [file?.path]);

  useEffect(() => {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const PREVIEW_W = 360;
    const PREVIEW_H = 360;
    const margin = 12;

    let x, side;
    if (r.right + PREVIEW_W + margin < w) {
      x = r.right + margin;
      side = 'right';
    } else if (r.left - PREVIEW_W - margin > 0) {
      x = r.left - PREVIEW_W - margin;
      side = 'left';
    } else {
      x = Math.max(margin, Math.min(w - PREVIEW_W - margin, r.left));
      side = 'below';
    }
    let y = r.top + r.height / 2 - PREVIEW_H / 2;
    if (y < margin) y = margin;
    if (y + PREVIEW_H > h - margin) y = h - margin - PREVIEW_H;

    setPos({ x, y, side });
  }, [anchor]);

  if (!file) return null;

  return (
    <div className={'hover-preview hover-' + pos.side} style={{ left: pos.x, top: pos.y }}>
      <div className="hover-img">
        {src ? <img src={src} alt="" draggable={false} /> : <div className="hover-skel" />}
      </div>
      <div className="hover-meta">
        <div className="hover-name">{file.name}</div>
        {file.size && <div className="hover-info">{Math.round(file.size / 1024)} Ko · {new Date(file.mtime).toLocaleDateString('fr-FR')}</div>}
      </div>
    </div>
  );
}
