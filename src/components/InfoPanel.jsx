import React, { useEffect, useState } from 'react';
import { M } from '../mascot.js';

function fmtSize(n) {
  if (!n) return '—';
  const u = ['o', 'Ko', 'Mo', 'Go'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return n.toFixed(i === 0 ? 0 : 1) + ' ' + u[i];
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('fr-FR');
}

export default function InfoPanel({ file, onSetRating }) {
  const [meta, setMeta] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!file) { setMeta(null); setTags([]); return; }
    let alive = true;
    window.bobeez.metadata(file.path).then(m => { if (alive) setMeta(m); });
    window.bobeez.getSidecar(file.path).then(s => { if (alive) setTags(s.tags || []); });
  }, [file?.path]);

  if (!file) return (
    <div className="info-empty">
      <img src={M.pensive} alt="" className="mascot-mini" />
      <p>Sélectionne une image pour voir ses infos.</p>
    </div>
  );

  const addTag = async (t) => {
    t = t.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    const s = await window.bobeez.getSidecar(file.path);
    s.tags = next;
    await window.bobeez.setSidecar(file.path, s);
    setTagInput('');
  };

  const removeTag = async (t) => {
    const next = tags.filter(x => x !== t);
    setTags(next);
    const s = await window.bobeez.getSidecar(file.path);
    s.tags = next;
    await window.bobeez.setSidecar(file.path, s);
  };

  return (
    <div className="info">
      <h3 title={file.name}>{file.name}</h3>

      <div className="info-stars">
        {[1,2,3,4,5].map(i => (
          <span
            key={i}
            className={'star ' + ((file.rating || 0) >= i ? 'on' : '')}
            onClick={() => onSetRating(i === (file.rating || 0) ? 0 : i)}
          >★</span>
        ))}
      </div>

      <div className="info-actions">
        <button className="btn ghost" onClick={() => window.bobeez.reveal(file.path)}>📂 Localiser</button>
        <button className="btn ghost" onClick={() => window.bobeez.openExternal(file.path)}>↗ Ouvrir</button>
      </div>

      <h4>Fichier</h4>
      <dl className="info-list">
        <dt>Chemin</dt><dd className="path-cell" title={file.path}>{file.path}</dd>
        <dt>Taille</dt><dd>{fmtSize(file.size)}</dd>
        <dt>Modifié</dt><dd>{fmtDate(file.mtime)}</dd>
      </dl>

      {meta && (
        <>
          <h4>Image</h4>
          <dl className="info-list">
            <dt>Dimensions</dt><dd>{meta.width && meta.height ? `${meta.width} × ${meta.height}` : '—'}</dd>
            <dt>Format</dt><dd>{meta.format || '—'}</dd>
            <dt>Canaux</dt><dd>{meta.channels || '—'}</dd>
            <dt>Densité</dt><dd>{meta.density ? meta.density + ' dpi' : '—'}</dd>
          </dl>

          {meta.exif && (
            <>
              <h4>EXIF</h4>
              <dl className="info-list">
                {meta.exif.Make && <><dt>Appareil</dt><dd>{meta.exif.Make} {meta.exif.Model}</dd></>}
                {meta.exif.LensModel && <><dt>Objectif</dt><dd>{meta.exif.LensModel}</dd></>}
                {meta.exif.FNumber && <><dt>Ouverture</dt><dd>f/{meta.exif.FNumber}</dd></>}
                {meta.exif.ExposureTime && <><dt>Exposition</dt><dd>{meta.exif.ExposureTime < 1 ? '1/' + Math.round(1/meta.exif.ExposureTime) + 's' : meta.exif.ExposureTime + 's'}</dd></>}
                {meta.exif.ISO && <><dt>ISO</dt><dd>{meta.exif.ISO}</dd></>}
                {meta.exif.FocalLength && <><dt>Focale</dt><dd>{meta.exif.FocalLength} mm</dd></>}
                {meta.exif.DateTimeOriginal && <><dt>Prise</dt><dd>{new Date(meta.exif.DateTimeOriginal).toLocaleString('fr-FR')}</dd></>}
                {meta.exif.latitude && <><dt>GPS</dt><dd>{meta.exif.latitude.toFixed(5)}, {meta.exif.longitude.toFixed(5)}</dd></>}
              </dl>
            </>
          )}
        </>
      )}

      <h4>Étiquettes</h4>
      <div className="tags">
        {tags.map(t => (
          <span key={t} className="tag" onClick={() => removeTag(t)} title="Cliquer pour retirer">
            {t} ×
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Ajouter une étiquette + Entrée"
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') addTag(tagInput); }}
      />
    </div>
  );
}
