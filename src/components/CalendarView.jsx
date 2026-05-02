import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { M } from '../mascot.js';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function dateOf(file) {
  const exifDate = file.exifDate;
  if (exifDate) return new Date(exifDate);
  return new Date(file.mtime);
}

function MonthCard({ year, month, files, onOpen }) {
  const days = [...new Set(files.map(f => dateOf(f).getDate()))].sort((a, b) => a - b);
  const cover = files[0];
  const [coverSrc, setCoverSrc] = useState(null);
  useEffect(() => {
    if (cover) {
      window.bobeez.thumbnail(cover.path, cover.mtime, 256).then(r => setCoverSrc(r.url));
    }
  }, [cover?.path]);

  return (
    <div className="cal-month">
      <div className="cal-month-header">
        <span className="cal-month-name">{MONTHS[month]} <span className="cal-year">{year}</span></span>
        <span className="cal-count">{files.length} photo{files.length > 1 ? 's' : ''}</span>
      </div>
      <div className="cal-cover" onClick={() => onOpen(files[0])}>
        {coverSrc && <img src={coverSrc} alt="" draggable={false} />}
        <div className="cal-cover-overlay">
          <span>Voir tout →</span>
        </div>
      </div>
      <div className="cal-days">
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
          const has = days.includes(d);
          const filesOfDay = files.filter(f => dateOf(f).getDate() === d);
          return (
            <button
              key={d}
              className={'cal-day ' + (has ? 'has' : '')}
              disabled={!has}
              onClick={() => has && onOpen(filesOfDay[0])}
              title={has ? `${filesOfDay.length} photo${filesOfDay.length > 1 ? 's' : ''} le ${d}` : ''}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="cal-thumbs">
        {files.slice(0, 6).map(f => (
          <CalThumb key={f.path} file={f} onClick={() => onOpen(f)} />
        ))}
        {files.length > 6 && (
          <div className="cal-more">+{files.length - 6}</div>
        )}
      </div>
    </div>
  );
}

function CalThumb({ file, onClick }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    window.bobeez.thumbnail(file.path, file.mtime, 96).then(r => { if (alive) setSrc(r.url); });
    return () => { alive = false; };
  }, [file.path]);
  return (
    <button className="cal-thumb" onClick={onClick} title={file.name}>
      {src && <img src={src} alt="" draggable={false} />}
    </button>
  );
}

export default function CalendarView({ files, onOpen }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const f of files) {
      const d = dateOf(f);
      const key = d.getFullYear() + '-' + d.getMonth();
      if (!map.has(key)) map.set(key, { year: d.getFullYear(), month: d.getMonth(), files: [] });
      map.get(key).files.push(f);
    }
    return [...map.values()].sort((a, b) => (b.year - a.year) || (b.month - a.month));
  }, [files]);

  if (!files.length) {
    return (
      <div className="empty mascot-empty">
        <img src={M.pensive} alt="" className="mascot-big" />
        <h3>Pas de photos à afficher</h3>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <Icon name="history" size={20} />
        <h2>Vue calendrier</h2>
        <span className="cal-total">{files.length} photo{files.length > 1 ? 's' : ''} · {grouped.length} mois</span>
      </div>
      <div className="calendar-grid">
        {grouped.map(g => (
          <MonthCard key={g.year + '-' + g.month} {...g} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
