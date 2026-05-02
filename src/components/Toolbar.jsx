import React from 'react';
import { M } from '../mascot.js';
import Icon from './Icon.jsx';
import Breadcrumb from './Breadcrumb.jsx';

const TAB_ICONS = [M.folder, M.binoculars, M.notebook];

export default function Toolbar({
  tabs, activeTab, onTab,
  onOpen, onRefresh, currentDir,
  history, historyIndex, onBack, onForward, onUp, recentFolders, onPickRecent, onNavigate,
  search, onSearch,
  sortBy, onSort,
  thumbSize, onThumbSize,
  filter, onFilter,
  selectedCount, onRotate, onDelete, onTriage,
  sidebarCollapsed, onToggleSidebar,
  infoCollapsed, onToggleInfo,
  onCmdK, onHelp,
}) {
  return (
    <header className="toolbar">
      <div className="toolbar-row top">
        <div className="brand" onClick={onCmdK} title="Palette de commandes (Ctrl+K)">
          <img src={M.logo} alt="Bobeez" className="brand-logo" draggable={false} />
          <span className="brand-name">Bobeez</span>
        </div>

        <div className="tabs">
          {tabs.map((t, i) => (
            <button
              key={t}
              className={'tab ' + (i === activeTab ? 'active' : '')}
              onClick={() => onTab(i)}
            >
              <img src={TAB_ICONS[i]} alt="" className="tab-icon" draggable={false} />
              {t}
            </button>
          ))}
        </div>

        <div className="spacer" />

        <button className="cmdk-trigger" onClick={onCmdK} title="Palette de commandes">
          <Icon name="search" size={14} />
          <span className="cmdk-text">Rechercher action, dossier, photo…</span>
          <kbd>Ctrl+K</kbd>
        </button>

        <div className="search-mini">
          <Icon name="search" size={14} />
          <input
            type="search"
            placeholder="Filtrer ce dossier"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        <button className="icon-btn" onClick={onHelp} title="Aide (?)"><Icon name="help" /></button>
      </div>

      <div className="toolbar-row bottom">
        <button className="icon-btn" onClick={onToggleSidebar} title={sidebarCollapsed ? 'Afficher le panneau latéral' : 'Masquer le panneau latéral'}>
          <Icon name="panelLeft" />
        </button>

        <Breadcrumb
          path={currentDir}
          onNavigate={onNavigate}
          history={history}
          historyIndex={historyIndex}
          onBack={onBack}
          onForward={onForward}
          onUp={onUp}
          recentFolders={recentFolders}
          onPickRecent={onPickRecent}
        />

        <button className="icon-btn" onClick={onOpen} title="Ouvrir un dossier (Ctrl+O)"><Icon name="open" /></button>
        <button className="icon-btn" onClick={onRefresh} title="Rafraîchir (F5)"><Icon name="refresh" /></button>

        <div className="spacer" />

        {selectedCount > 0 && (
          <div className="batch-actions">
            <span className="badge">{selectedCount}</span>
            <button className="icon-btn" onClick={() => onRotate(-90)} title="Rotation gauche"><Icon name="rotateLeft" /></button>
            <button className="icon-btn" onClick={() => onRotate(90)} title="Rotation droite"><Icon name="rotateRight" /></button>
            <button className="icon-btn danger" onClick={onDelete} title="Supprimer (Suppr)"><Icon name="trash" /></button>
          </div>
        )}

        <button className="btn ghost triage-trigger" onClick={onTriage} title="Mode triage rapide (T)" disabled={!currentDir}>
          <Icon name="compare" size={14} /> Triage
        </button>

        <select className="select" value={sortBy} onChange={e => onSort(e.target.value)} title="Trier">
          <option value="name">Nom A→Z</option>
          <option value="name-desc">Nom Z→A</option>
          <option value="date">Date ↓</option>
          <option value="date-asc">Date ↑</option>
          <option value="size">Taille ↓</option>
          <option value="rating">Note ↓</option>
        </select>

        <select
          className="select"
          value={filter.minRating}
          onChange={e => onFilter({ ...filter, minRating: parseInt(e.target.value) })}
          title="Filtrer par note minimum"
        >
          <option value={0}>Toutes</option>
          <option value={1}>★ 1+</option>
          <option value={2}>★★ 2+</option>
          <option value={3}>★★★ 3+</option>
          <option value={4}>★★★★ 4+</option>
          <option value={5}>★★★★★ 5</option>
        </select>

        <div className="thumb-size-ctl">
          <Icon name="grid" size={12} />
          <input
            type="range"
            min={80}
            max={400}
            step={10}
            value={thumbSize}
            onChange={e => onThumbSize(parseInt(e.target.value))}
            title="Taille des miniatures (+/−)"
          />
        </div>

        <button className="icon-btn" onClick={onToggleInfo} title={infoCollapsed ? 'Afficher le panneau d\'info' : 'Masquer le panneau d\'info'}>
          <Icon name="panelRight" />
        </button>
      </div>
    </header>
  );
}
