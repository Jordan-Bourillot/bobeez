import React, { useEffect, useState, useCallback } from 'react';
import { M } from '../mascot.js';

function TreeNode({ node, depth, currentDir, onSelectDir, expanded, onToggle, children }) {
  const isOpen = expanded.has(node.path);
  const isCurrent = currentDir === node.path;
  return (
    <div className="tree-node">
      <div
        className={'tree-row ' + (isCurrent ? 'current' : '')}
        style={{ paddingLeft: depth * 12 + 6 }}
        onClick={() => onSelectDir(node.path)}
        onDoubleClick={() => onToggle(node.path)}
      >
        <span
          className="tree-caret"
          onClick={e => { e.stopPropagation(); onToggle(node.path); }}
        >{isOpen ? '▾' : '▸'}</span>
        <span className="tree-icon">📁</span>
        <span className="tree-label" title={node.path}>{node.name}</span>
      </div>
      {isOpen && children}
    </div>
  );
}

function Subtree({ path, depth, currentDir, onSelectDir, expanded, onToggle }) {
  const [kids, setKids] = useState(null);
  useEffect(() => {
    let alive = true;
    window.bobeez.listSubdirs(path).then(r => { if (alive) setKids(r); });
    return () => { alive = false; };
  }, [path]);
  if (kids === null) return <div className="tree-loading" style={{ paddingLeft: depth * 12 + 24 }}>…</div>;
  if (!kids.length) return null;
  return (
    <>
      {kids.map(k => (
        <TreeNode
          key={k.path}
          node={k}
          depth={depth}
          currentDir={currentDir}
          onSelectDir={onSelectDir}
          expanded={expanded}
          onToggle={onToggle}
        >
          <Subtree
            path={k.path}
            depth={depth + 1}
            currentDir={currentDir}
            onSelectDir={onSelectDir}
            expanded={expanded}
            onToggle={onToggle}
          />
        </TreeNode>
      ))}
    </>
  );
}

export default function FolderTree({ currentDir, onSelectDir, favorites, onToggleFavorite }) {
  const [drives, setDrives] = useState([]);
  const [shortcuts, setShortcuts] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => {
    window.bobeez.drives().then(setDrives);
    window.bobeez.homeDirs().then(setShortcuts);
  }, []);

  const toggle = useCallback((p) => {
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(p)) s.delete(p); else s.add(p);
      return s;
    });
  }, []);

  return (
    <div className="folder-tree">
      <div className="tree-section">
        <h3>Raccourcis</h3>
        {shortcuts && (
          <>
            <ShortcutRow label="🏠 Accueil" path={shortcuts.home} currentDir={currentDir} onSelectDir={onSelectDir} />
            <ShortcutRow label="🖼 Images" path={shortcuts.pictures} currentDir={currentDir} onSelectDir={onSelectDir} />
            <ShortcutRow label="🖥 Bureau" path={shortcuts.desktop} currentDir={currentDir} onSelectDir={onSelectDir} />
            <ShortcutRow label="⬇ Téléch." path={shortcuts.downloads} currentDir={currentDir} onSelectDir={onSelectDir} />
          </>
        )}
      </div>

      {favorites.length > 0 && (
        <div className="tree-section">
          <h3><img src={M.happy} alt="" className="section-mascot" /> Favoris</h3>
          {favorites.map(f => (
            <div
              key={f.path}
              className={'tree-row shortcut ' + (currentDir === f.path ? 'current' : '')}
              onClick={() => onSelectDir(f.path)}
              title={f.path}
            >
              <span className="tree-icon">⭐</span>
              <span className="tree-label">{f.name}</span>
              <button
                className="tree-action"
                onClick={e => { e.stopPropagation(); onToggleFavorite(f.path); }}
                title="Retirer des favoris"
              >×</button>
            </div>
          ))}
        </div>
      )}

      <div className="tree-section">
        <h3>Disques</h3>
        {drives.map(d => (
          <TreeNode
            key={d.path}
            node={{ name: d.name, path: d.path }}
            depth={0}
            currentDir={currentDir}
            onSelectDir={onSelectDir}
            expanded={expanded}
            onToggle={toggle}
          >
            <Subtree
              path={d.path}
              depth={1}
              currentDir={currentDir}
              onSelectDir={onSelectDir}
              expanded={expanded}
              onToggle={toggle}
            />
          </TreeNode>
        ))}
      </div>

      {currentDir && !favorites.some(f => f.path === currentDir) && (
        <button className="btn ghost" onClick={() => onToggleFavorite(currentDir)}>
          ⭐ Ajouter aux favoris
        </button>
      )}
    </div>
  );
}

function ShortcutRow({ label, path, currentDir, onSelectDir }) {
  if (!path) return null;
  return (
    <div
      className={'tree-row shortcut ' + (currentDir === path ? 'current' : '')}
      onClick={() => onSelectDir(path)}
      title={path}
    >
      <span className="tree-label">{label}</span>
    </div>
  );
}
