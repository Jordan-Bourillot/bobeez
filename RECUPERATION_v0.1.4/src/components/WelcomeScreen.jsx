import React from 'react';
import { M } from '../mascot.js';
import Icon from './Icon.jsx';

const FEATURES = [
  { icon: 'search', title: 'Palette de commandes', desc: 'Ctrl+K — fais tout au clavier', mascot: 'binoculars' },
  { icon: 'compare', title: 'Mode triage', desc: 'T — trie tes photos en plein écran, comme un swipe', mascot: 'happy' },
  { icon: 'history', title: 'Vue calendrier', desc: 'Tes photos organisées par mois et par jour', mascot: 'photos' },
  { icon: 'reveal', title: 'Vue carte', desc: 'Toutes tes photos GPS sur une carte du monde', mascot: 'pensive' },
  { icon: 'edit', title: 'Édition non destructive', desc: 'Recadre, ajuste — l\'original reste intact', mascot: 'notebook' },
  { icon: 'download', title: 'Export par lot', desc: 'Convertir N photos en JPG/PNG/WebP/AVIF d\'un coup', mascot: 'folder' },
];

export default function WelcomeScreen({ onClose, onPickFolder }) {
  return (
    <div className="welcome-backdrop">
      <div className="welcome">
        <div className="welcome-hero">
          <img src={M.base} alt="" className="welcome-mascot" />
          <h1>Bienvenue dans <span className="brand-name">Bobeez</span></h1>
          <p>Le gestionnaire d'images moderne, rapide, et vivant.</p>
        </div>

        <div className="welcome-features">
          {FEATURES.map(f => (
            <div key={f.title} className="feat-card">
              <img src={M[f.mascot]} alt="" className="feat-mascot" />
              <div className="feat-text">
                <h4><Icon name={f.icon} size={14} /> {f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="welcome-cta">
          <button className="btn primary big" onClick={onPickFolder}>
            <Icon name="folder" /> Choisir mon dossier de photos
          </button>
          <button className="btn ghost" onClick={onClose}>Plus tard</button>
        </div>

        <div className="welcome-hint">
          Astuce : tu peux aussi <strong>déposer un dossier</strong> n'importe où dans la fenêtre.
        </div>
      </div>
    </div>
  );
}
