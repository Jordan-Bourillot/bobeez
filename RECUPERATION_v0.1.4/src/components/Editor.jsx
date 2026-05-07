import React, { useEffect, useRef, useState } from 'react';
import { M } from '../mascot.js';
import Icon from './Icon.jsx';
import CropTool from './CropTool.jsx';
import { toastSuccess, toastError, toastInfo } from '../lib/toast.js';

const DEFAULT_ADJ = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  hueRotate: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
};

export default function Editor({ file, onSaved }) {
  const [src, setSrc] = useState(null);
  const [adj, setAdj] = useState(DEFAULT_ADJ);
  const [rot, setRot] = useState(0);
  const [angle, setAngle] = useState(0); // fine straighten
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [crop, setCrop] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('adjust'); // adjust | crop | export
  const stageRef = useRef(null);
  const splitDragRef = useRef(false);

  useEffect(() => {
    if (!file) return;
    let alive = true;
    window.bobeez.fullUrl(file.path).then(u => { if (alive) setSrc(u); });
    window.bobeez.getSidecar(file.path).then(s => {
      if (!alive) return;
      if (s.adjustments) {
        setAdj({ ...DEFAULT_ADJ, ...s.adjustments });
        setRot(s.adjustments.rot || 0);
        setAngle(s.adjustments.angle || 0);
        setFlipH(!!s.adjustments.flipH);
        setFlipV(!!s.adjustments.flipV);
        setCrop(s.adjustments.crop || null);
      } else {
        setAdj(DEFAULT_ADJ); setRot(0); setAngle(0); setFlipH(false); setFlipV(false); setCrop(null);
      }
    });
  }, [file?.path]);

  // Split divider drag
  useEffect(() => {
    const onUp = () => { splitDragRef.current = false; };
    const onMove = (e) => {
      if (!splitDragRef.current || !stageRef.current) return;
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

  if (!file) return (
    <div className="empty mascot-empty">
      <img src={M.notebook} alt="" className="mascot-big" />
      <h3>Prêt à éditer</h3>
      <p>Sélectionne une image dans la grille pour l'éditer.</p>
    </div>
  );

  const filterStyle = `
    brightness(${adj.brightness})
    contrast(${adj.contrast})
    saturate(${adj.saturate})
    hue-rotate(${adj.hueRotate}deg)
    blur(${adj.blur}px)
    sepia(${adj.sepia})
    grayscale(${adj.grayscale})
    invert(${adj.invert})
  `;

  const transform = `
    rotate(${rot + angle}deg)
    scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})
  `;

  const reset = () => {
    setAdj(DEFAULT_ADJ);
    setRot(0); setAngle(0); setFlipH(false); setFlipV(false); setCrop(null);
    toastInfo('Réglages réinitialisés');
  };

  const saveSidecar = async () => {
    const s = await window.bobeez.getSidecar(file.path);
    s.adjustments = { ...adj, rot, angle, flipH, flipV, crop };
    await window.bobeez.setSidecar(file.path, s);
    toastSuccess('Réglages sauvegardés (non destructif)');
  };

  const onCropConfirm = (region) => {
    setCrop(region);
    setShowCrop(false);
    setActiveTab('adjust');
    toastSuccess(`Recadré à ${region.width} × ${region.height} px`);
  };

  const exportImage = async () => {
    setExporting(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      // Apply crop first if any
      const sx = crop?.left ?? 0;
      const sy = crop?.top ?? 0;
      const sw = crop?.width ?? img.naturalWidth;
      const sh = crop?.height ?? img.naturalHeight;

      const totalRot = rot + angle;
      const swap = Math.abs(totalRot % 180) > 45 && Math.abs(totalRot % 180) < 135;
      const cw = swap ? sh : sw;
      const ch = swap ? sw : sh;
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.filter = filterStyle.replace(/\s+/g, ' ').trim();
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate((totalRot * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace(/\.[^.]+$/, '') + '_édité.jpg';
      a.click();
      URL.revokeObjectURL(a.href);
      toastSuccess('Image exportée');
    } catch (e) {
      toastError('Erreur d\'export : ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  if (showCrop && src) {
    return <CropTool src={src} onCancel={() => setShowCrop(false)} onConfirm={onCropConfirm} />;
  }

  const editedImg = src && (
    <img
      src={src}
      alt={file.name}
      draggable={false}
      style={{
        filter: filterStyle,
        transform,
        clipPath: crop ? `inset(${(crop.top / 100)}px ${(crop.left / 100)}px)` : undefined,
      }}
    />
  );

  return (
    <div className="editor">
      <div className="editor-stage" ref={stageRef}>
        {showBefore && src ? (
          <div className="editor-split">
            <div className="es-before" style={{ width: splitPos + '%' }}>
              <img src={src} alt="" draggable={false} />
              <div className="es-label es-before-label">Avant</div>
            </div>
            <div className="es-after" style={{ width: (100 - splitPos) + '%' }}>
              <img
                src={src}
                alt=""
                draggable={false}
                style={{ filter: filterStyle, transform, marginLeft: -100 / (100 - splitPos) * 100 + '%' }}
              />
              <div className="es-label es-after-label">Après</div>
            </div>
            <div
              className="editor-divider"
              style={{ left: splitPos + '%' }}
              onMouseDown={() => { splitDragRef.current = true; }}
            >
              <div className="divider-handle">⇆</div>
            </div>
          </div>
        ) : editedImg}
      </div>

      <div className="editor-panel">
        <div className="ed-tabs">
          <button className={'ed-tab ' + (activeTab === 'adjust' ? 'active' : '')} onClick={() => setActiveTab('adjust')}>Ajuster</button>
          <button className={'ed-tab ' + (activeTab === 'crop' ? 'active' : '')} onClick={() => setActiveTab('crop')}>Recadrer</button>
          <button className={'ed-tab ' + (activeTab === 'export' ? 'active' : '')} onClick={() => setActiveTab('export')}>Exporter</button>
        </div>

        {activeTab === 'adjust' && (
          <>
            <button
              className={'btn ghost full beforeafter-btn ' + (showBefore ? 'active' : '')}
              onClick={() => setShowBefore(v => !v)}
              disabled={!src}
            >
              <Icon name="compare" size={14} /> {showBefore ? 'Masquer Avant/Après' : 'Avant / Après'}
            </button>

            <div className="ed-group">
              <label>Rotation</label>
              <div className="row">
                <button className="btn" onClick={() => setRot(r => (r + 270) % 360)}><Icon name="rotateLeft" size={14} /> 90°</button>
                <button className="btn" onClick={() => setRot(r => (r + 90) % 360)}><Icon name="rotateRight" size={14} /> 90°</button>
                <button className={'btn ' + (flipH ? 'active' : '')} onClick={() => setFlipH(v => !v)}>↔ H</button>
                <button className={'btn ' + (flipV ? 'active' : '')} onClick={() => setFlipV(v => !v)}>↕ V</button>
              </div>
            </div>

            <Slider label="Redresser" value={angle} min={-15} max={15} step={0.1}
                    onChange={v => setAngle(v)} fmt={v => v.toFixed(1) + '°'} />
            <Slider label="Luminosité" value={adj.brightness} min={0} max={2} step={0.01}
                    onChange={v => setAdj(a => ({ ...a, brightness: v }))} fmt={v => Math.round(v*100) + '%'} />
            <Slider label="Contraste" value={adj.contrast} min={0} max={2} step={0.01}
                    onChange={v => setAdj(a => ({ ...a, contrast: v }))} fmt={v => Math.round(v*100) + '%'} />
            <Slider label="Saturation" value={adj.saturate} min={0} max={2} step={0.01}
                    onChange={v => setAdj(a => ({ ...a, saturate: v }))} fmt={v => Math.round(v*100) + '%'} />
            <Slider label="Teinte" value={adj.hueRotate} min={-180} max={180} step={1}
                    onChange={v => setAdj(a => ({ ...a, hueRotate: v }))} fmt={v => v + '°'} />
            <Slider label="Flou" value={adj.blur} min={0} max={20} step={0.1}
                    onChange={v => setAdj(a => ({ ...a, blur: v }))} fmt={v => v.toFixed(1) + 'px'} />
            <Slider label="Sépia" value={adj.sepia} min={0} max={1} step={0.01}
                    onChange={v => setAdj(a => ({ ...a, sepia: v }))} fmt={v => Math.round(v*100) + '%'} />
            <Slider label="N&B" value={adj.grayscale} min={0} max={1} step={0.01}
                    onChange={v => setAdj(a => ({ ...a, grayscale: v }))} fmt={v => Math.round(v*100) + '%'} />
            <Slider label="Négatif" value={adj.invert} min={0} max={1} step={0.01}
                    onChange={v => setAdj(a => ({ ...a, invert: v }))} fmt={v => Math.round(v*100) + '%'} />

            <div className="ed-actions">
              <button className="btn ghost" onClick={reset}>Réinitialiser</button>
              <button className="btn" onClick={saveSidecar}><Icon name="check" size={14} /> Sauvegarder</button>
            </div>
          </>
        )}

        {activeTab === 'crop' && (
          <div className="crop-tab">
            <p className="hint">Recadrage non destructif. L'original reste intact.</p>
            {crop && (
              <div className="crop-info">
                <div>Recadrage actif :</div>
                <div className="muted">{crop.width} × {crop.height} px à ({crop.left}, {crop.top})</div>
              </div>
            )}
            <button className="btn primary full" onClick={() => setShowCrop(true)} disabled={!src}>
              <Icon name="fit" size={14} /> {crop ? 'Modifier le recadrage' : 'Démarrer le recadrage'}
            </button>
            {crop && (
              <button className="btn ghost full" onClick={() => { setCrop(null); toastInfo('Recadrage annulé'); }}>
                Retirer le recadrage
              </button>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="export-tab">
            <p className="hint">Crée une copie avec tous les réglages appliqués (rotation, recadrage, ajustements).</p>
            <button className="btn primary full" onClick={exportImage} disabled={exporting}>
              {exporting ? 'Export…' : <><Icon name="download" size={14} /> Exporter en JPG</>}
            </button>
            <p className="hint">L'export final passe par Sharp côté natif pour une meilleure qualité (à venir).</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }) {
  return (
    <div className="ed-slider">
      <div className="row between">
        <label>{label}</label>
        <span className="val">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}
