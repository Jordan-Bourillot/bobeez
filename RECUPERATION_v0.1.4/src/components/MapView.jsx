import React, { useEffect, useState, useRef } from 'react';
import Icon from './Icon.jsx';
import { M } from '../mascot.js';

// Simplified equirectangular projection.
// Lat range: -90 (south) to 90 (north). Lon range: -180 (west) to 180 (east).
// Map width 1000, height 500. (lon+180)/360 * 1000, (90-lat)/180 * 500.

function project(lat, lon, w, h) {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

// Simple SVG world outline (highly simplified continents as paths)
const WORLD_PATH = `
M150,180 Q200,150 250,180 L320,200 Q350,210 380,200 L420,180 L450,200 L480,250 L460,300 L420,330 L380,310 L340,290 L300,310 L260,330 L220,310 L180,290 L150,250 Z
M520,170 Q580,150 640,170 L700,180 Q760,200 800,230 L820,280 L800,320 L760,340 L700,330 L640,310 L580,300 L520,280 L500,230 Z
M850,200 Q880,180 910,200 L940,230 L920,260 L890,250 L860,240 Z
M380,360 Q420,340 460,360 L480,400 L460,440 L420,450 L380,430 L370,400 Z
M620,360 L680,340 L720,370 L740,420 L720,460 L680,470 L640,450 L620,420 Z
M880,400 Q900,380 920,400 L930,430 L910,440 Z
`;

function ZoomPanSvg({ children }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const onWheel = (e) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.2 : 0.83;
    setZoom(z => Math.max(0.5, Math.min(8, z * f)));
  };
  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onMouseUp = () => { dragRef.current = null; };

  return (
    <div
      className="map-svg-wrap"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
    >
      <svg viewBox="0 0 1000 500" className="world-map" preserveAspectRatio="xMidYMid meet">
        <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}>
          {children}
        </g>
      </svg>
      <div className="map-zoom-ctl">
        <button className="icon-btn" onClick={() => setZoom(z => Math.min(8, z * 1.3))}><Icon name="zoomIn" /></button>
        <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.5, z * 0.77))}><Icon name="zoomOut" /></button>
        <button className="icon-btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Réinitialiser"><Icon name="fit" /></button>
        <span className="map-zoom-label">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

export default function MapView({ files, onOpen }) {
  const [withGps, setWithGps] = useState([]);
  const [scanning, setScanning] = useState(true);
  const [hoverFile, setHoverFile] = useState(null);

  useEffect(() => {
    let alive = true;
    setScanning(true);
    setWithGps([]);
    (async () => {
      const result = [];
      // Limit scan to first 200 files to stay snappy
      for (const f of files.slice(0, 500)) {
        if (!alive) return;
        try {
          const meta = await window.bobeez.metadata(f.path);
          const ex = meta?.exif;
          if (ex?.latitude != null && ex?.longitude != null) {
            result.push({ ...f, lat: ex.latitude, lon: ex.longitude, exif: ex });
            if (alive) setWithGps([...result]);
          }
        } catch {}
      }
      if (alive) setScanning(false);
    })();
    return () => { alive = false; };
  }, [files]);

  if (!files.length) {
    return (
      <div className="empty mascot-empty">
        <img src={M.pensive} alt="" className="mascot-big" />
        <h3>Aucune photo</h3>
      </div>
    );
  }

  return (
    <div className="map-view">
      <div className="map-header">
        <Icon name="reveal" size={18} />
        <h2>Vue carte</h2>
        <span className="map-info">
          {withGps.length} photo{withGps.length > 1 ? 's' : ''} géolocalisée{withGps.length > 1 ? 's' : ''} sur {files.length}
          {scanning && ' · analyse…'}
        </span>
      </div>
      <ZoomPanSvg>
        {/* Background grid */}
        <rect x={0} y={0} width={1000} height={500} fill="#0a0d14" />
        {/* Lat/lon grid */}
        {[-60, -30, 0, 30, 60].map(lat => (
          <line key={lat} x1={0} x2={1000} y1={(90 - lat) / 180 * 500} y2={(90 - lat) / 180 * 500} stroke="#1a1f2e" strokeWidth={0.5} />
        ))}
        {[-120, -60, 0, 60, 120].map(lon => (
          <line key={lon} y1={0} y2={500} x1={(lon + 180) / 360 * 1000} x2={(lon + 180) / 360 * 1000} stroke="#1a1f2e" strokeWidth={0.5} />
        ))}
        {/* Equator */}
        <line x1={0} x2={1000} y1={250} y2={250} stroke="#2a3142" strokeWidth={0.6} strokeDasharray="4 6" />
        {/* Continents */}
        <path d={WORLD_PATH} fill="#1c2230" stroke="#2a3142" strokeWidth={0.8} />
        {/* GPS pins */}
        {withGps.map(f => {
          const { x, y } = project(f.lat, f.lon, 1000, 500);
          const active = hoverFile?.path === f.path;
          return (
            <g
              key={f.path}
              transform={`translate(${x}, ${y})`}
              onClick={() => onOpen(f)}
              onMouseEnter={() => setHoverFile(f)}
              onMouseLeave={() => setHoverFile(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle r={active ? 9 : 6} fill="var(--accent)" opacity={0.3} />
              <circle r={active ? 5 : 3.5} fill="var(--accent)" stroke="#fff" strokeWidth={1} />
            </g>
          );
        })}
      </ZoomPanSvg>
      {hoverFile && (
        <div className="map-tooltip">
          <strong>{hoverFile.name}</strong>
          <br />
          {hoverFile.lat.toFixed(4)}, {hoverFile.lon.toFixed(4)}
        </div>
      )}
      {!scanning && withGps.length === 0 && (
        <div className="map-empty">
          <img src={M.pensive} alt="" />
          <p>Aucune photo géolocalisée dans ce dossier.</p>
        </div>
      )}
    </div>
  );
}
