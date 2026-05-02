import React from 'react';
import { M } from '../mascot.js';
import Icon from './Icon.jsx';

export default function StatusBar({ currentDir, total, filtered, selected, onCmdK, onHelp, onSettings }) {
  return (
    <footer className="statusbar">
      <span className="status-item path-cell" title={currentDir}>{currentDir || '—'}</span>
      <span className="spacer" />
      <span className="status-item">{filtered} / {total} image{total > 1 ? 's' : ''}</span>
      {selected > 0 && <span className="status-item status-sel">{selected} sélectionnée{selected > 1 ? 's' : ''}</span>}
      <button className="status-btn" onClick={onCmdK} title="Palette de commandes (Ctrl+K)">
        <Icon name="search" size={14} /> <kbd>Ctrl+K</kbd>
      </button>
      <button className="status-btn" onClick={onHelp} title="Aide (?)">
        <Icon name="help" size={14} />
      </button>
      <button className="status-btn" onClick={onSettings} title="Paramètres">
        <Icon name="settings" size={14} />
      </button>
      <span className="status-item muted brand-mini">
        <img src={M.happy} alt="" className="mascot-statusbar" />
        Bobeez
      </span>
    </footer>
  );
}
