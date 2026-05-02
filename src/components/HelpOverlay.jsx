import React from 'react';
import Icon from './Icon.jsx';
import { M } from '../mascot.js';

const SHORTCUTS = [
  { section: 'Navigation', items: [
    ['Ctrl+K', 'Palette de commandes'],
    ['Ctrl+O', 'Ouvrir un dossier'],
    ['Alt+←', 'Précédent'],
    ['Alt+→', 'Suivant'],
    ['Alt+↑', 'Dossier parent'],
    ['F5', 'Rafraîchir'],
    ['?', 'Cette aide'],
  ]},
  { section: 'Sélection', items: [
    ['Clic', 'Sélectionner'],
    ['Shift+Clic', 'Étendre la sélection'],
    ['Ctrl+Clic', 'Ajouter / retirer'],
    ['Ctrl+A', 'Tout sélectionner'],
    ['Esc', 'Désélectionner'],
    ['↑↓←→', 'Naviguer dans la grille'],
  ]},
  { section: 'Notation', items: [
    ['0–5', 'Note (0 à 5 étoiles)'],
    ['T', 'Mode triage rapide'],
  ]},
  { section: 'Actions', items: [
    ['Entrée', 'Ouvrir / Voir'],
    ['Espace', 'Aperçu rapide'],
    ['F2', 'Renommer'],
    ['Suppr', 'Mettre à la corbeille'],
    ['+ / −', 'Taille des miniatures'],
  ]},
  { section: 'Visualiseur', items: [
    ['← →', 'Photo précédente / suivante'],
    ['+ / −', 'Zoom'],
    ['0', 'Réinitialiser le zoom'],
    ['R / L', 'Rotation droite / gauche'],
    ['F / F11', 'Plein écran'],
    ['Espace', 'Diaporama'],
  ]},
];

export default function HelpOverlay({ onClose }) {
  return (
    <div className="help-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="help-modal">
        <div className="help-header">
          <img src={M.notebook} alt="" className="help-mascot" />
          <h2>Raccourcis clavier</h2>
          <button className="icon-btn" onClick={onClose} title="Fermer (Esc)"><Icon name="close" /></button>
        </div>
        <div className="help-content">
          {SHORTCUTS.map(s => (
            <div key={s.section} className="help-section">
              <h3>{s.section}</h3>
              <dl>
                {s.items.map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt><kbd>{k}</kbd></dt>
                    <dd>{v}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="help-footer">
          Astuce : <kbd>Ctrl+K</kbd> ouvre la palette de commandes — tape n'importe quelle action.
        </div>
      </div>
    </div>
  );
}
