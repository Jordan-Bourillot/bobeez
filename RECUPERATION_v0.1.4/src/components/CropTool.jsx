import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const RATIOS = [
  { label: 'Libre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4/3 },
  { label: '3:2', value: 3/2 },
  { label: '16:9', value: 16/9 },
  { label: '9:16', value: 9/16 },
];

export default function CropTool({ src, onCancel, onConfirm }) {
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const [imgRect, setImgRect] = useState(null);
  const [crop, setCrop] = useState(null); // { x, y, w, h } in image space (0-1)
  const [ratio, setRatio] = useState(null);
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const onLoad = () => {
      const r = img.getBoundingClientRect();
      const stageR = stageRef.current.getBoundingClientRect();
      setImgRect({
        x: r.left - stageR.left,
        y: r.top - stageR.top,
        w: r.width,
        h: r.height,
        nw: img.naturalWidth,
        nh: img.naturalHeight,
      });
      setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    };
    if (img.complete) onLoad();
    else img.addEventListener('load', onLoad);
    return () => img.removeEventListener('load', onLoad);
  }, [src]);

  // Recompute layout on resize
  useEffect(() => {
    const onResize = () => {
      if (imgRef.current) {
        const img = imgRef.current;
        const r = img.getBoundingClientRect();
        const stageR = stageRef.current.getBoundingClientRect();
        setImgRect(p => p ? { ...p, x: r.left - stageR.left, y: r.top - stageR.top, w: r.width, h: r.height } : p);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!src) return null;

  const startDrag = (mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } });
  };

  const onMouseMove = (e) => {
    if (!drag || !imgRect) return;
    const dx = (e.clientX - drag.startX) / imgRect.w;
    const dy = (e.clientY - drag.startY) / imgRect.h;
    let { x, y, w, h } = drag.startCrop;

    if (drag.mode === 'move') {
      x = Math.max(0, Math.min(1 - w, x + dx));
      y = Math.max(0, Math.min(1 - h, y + dy));
    } else {
      // edge / corner
      let nx = x, ny = y, nw = w, nh = h;
      if (drag.mode.includes('w')) { nx = x + dx; nw = w - dx; }
      if (drag.mode.includes('e')) { nw = w + dx; }
      if (drag.mode.includes('n')) { ny = y + dy; nh = h - dy; }
      if (drag.mode.includes('s')) { nh = h + dy; }

      // Clamp
      if (nw < 0.05) { if (drag.mode.includes('w')) nx = x + w - 0.05; nw = 0.05; }
      if (nh < 0.05) { if (drag.mode.includes('n')) ny = y + h - 0.05; nh = 0.05; }
      nx = Math.max(0, nx);
      ny = Math.max(0, ny);
      if (nx + nw > 1) nw = 1 - nx;
      if (ny + nh > 1) nh = 1 - ny;

      // Apply ratio
      if (ratio && drag.mode !== 'move') {
        const targetH = nw * (imgRect.nw / imgRect.nh) / ratio;
        // simpler: enforce width-based
        const aspectH = nw / ratio * (imgRect.nw / imgRect.nh);
        if (drag.mode.includes('s')) {
          nh = aspectH;
          if (ny + nh > 1) nh = 1 - ny;
        } else if (drag.mode.includes('n')) {
          const newH = aspectH;
          ny = ny + nh - newH;
          nh = newH;
          if (ny < 0) { nh += ny; ny = 0; }
        }
      }
      x = nx; y = ny; w = nw; h = nh;
    }
    setCrop({ x, y, w, h });
  };

  const endDrag = () => setDrag(null);

  const confirm = () => {
    if (!crop || !imgRect) return;
    onConfirm({
      left: Math.round(crop.x * imgRect.nw),
      top: Math.round(crop.y * imgRect.nh),
      width: Math.round(crop.w * imgRect.nw),
      height: Math.round(crop.h * imgRect.nh),
    });
  };

  return (
    <div className="crop-overlay" onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
      <div className="crop-stage" ref={stageRef}>
        <img ref={imgRef} src={src} alt="" draggable={false} />
        {crop && imgRect && (
          <>
            <div className="crop-mask top" style={{
              left: imgRect.x, top: imgRect.y,
              width: imgRect.w, height: crop.y * imgRect.h,
            }} />
            <div className="crop-mask bottom" style={{
              left: imgRect.x, top: imgRect.y + (crop.y + crop.h) * imgRect.h,
              width: imgRect.w, height: (1 - crop.y - crop.h) * imgRect.h,
            }} />
            <div className="crop-mask left" style={{
              left: imgRect.x, top: imgRect.y + crop.y * imgRect.h,
              width: crop.x * imgRect.w, height: crop.h * imgRect.h,
            }} />
            <div className="crop-mask right" style={{
              left: imgRect.x + (crop.x + crop.w) * imgRect.w,
              top: imgRect.y + crop.y * imgRect.h,
              width: (1 - crop.x - crop.w) * imgRect.w, height: crop.h * imgRect.h,
            }} />
            <div
              className="crop-frame"
              style={{
                left: imgRect.x + crop.x * imgRect.w,
                top: imgRect.y + crop.y * imgRect.h,
                width: crop.w * imgRect.w,
                height: crop.h * imgRect.h,
              }}
              onMouseDown={startDrag('move')}
            >
              <div className="crop-grid" />
              {['n','s','w','e','nw','ne','sw','se'].map(side => (
                <div key={side} className={'crop-handle h-' + side} onMouseDown={startDrag(side)} />
              ))}
              <div className="crop-dim">
                {Math.round(crop.w * imgRect.nw)} × {Math.round(crop.h * imgRect.nh)} px
              </div>
            </div>
          </>
        )}
      </div>
      <div className="crop-controls">
        <div className="ratio-buttons">
          {RATIOS.map(r => (
            <button
              key={r.label}
              className={'btn ' + (ratio === r.value ? 'primary' : 'ghost')}
              onClick={() => setRatio(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <button className="btn ghost" onClick={onCancel}>Annuler</button>
        <button className="btn primary" onClick={confirm}>
          <Icon name="check" size={14} /> Recadrer
        </button>
      </div>
    </div>
  );
}
