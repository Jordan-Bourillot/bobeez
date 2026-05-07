import React from 'react';
import Icon from './Icon.jsx';

export default function Breadcrumb({ path, onNavigate, history, historyIndex, onBack, onForward, onUp, recentFolders, onPickRecent }) {
  if (!path) return <div className="breadcrumb empty">Aucun dossier ouvert</div>;
  const isWin = /^[A-Z]:[\\/]/i.test(path);
  const sep = isWin ? '\\' : '/';
  const parts = path.split(/[\\/]/).filter(Boolean);
  const segments = [];
  let acc = '';
  for (let i = 0; i < parts.length; i++) {
    if (i === 0 && isWin) {
      acc = parts[0] + sep;
      segments.push({ label: parts[0], path: acc });
    } else {
      acc = (acc.endsWith(sep) ? acc : acc + sep) + parts[i];
      segments.push({ label: parts[i], path: acc });
    }
  }

  const canBack = historyIndex > 0;
  const canForward = historyIndex < history.length - 1;
  const canUp = segments.length > 1;

  const [showRecent, setShowRecent] = React.useState(false);

  return (
    <div className="breadcrumb-bar">
      <button className="nav-btn" onClick={onBack} disabled={!canBack} title="Précédent (Alt+←)">
        <Icon name="back" size={16} />
      </button>
      <button className="nav-btn" onClick={onForward} disabled={!canForward} title="Suivant (Alt+→)">
        <Icon name="forward" size={16} />
      </button>
      <button className="nav-btn" onClick={onUp} disabled={!canUp} title="Dossier parent (Alt+↑)">
        <Icon name="up" size={16} />
      </button>

      <div className="recent-trigger-wrap">
        <button className="nav-btn" onClick={() => setShowRecent(v => !v)} title="Dossiers récents">
          <Icon name="history" size={16} />
        </button>
        {showRecent && recentFolders?.length > 0 && (
          <div className="recent-pop" onMouseLeave={() => setShowRecent(false)}>
            <div className="recent-title">Récents</div>
            {recentFolders.map(f => (
              <button
                key={f.path}
                className="recent-item"
                onClick={() => { setShowRecent(false); onPickRecent(f.path); }}
                title={f.path}
              >
                <Icon name="folder" size={14} />
                <span className="recent-name">{f.name}</span>
                <span className="recent-path">{f.path}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="breadcrumb">
        {segments.map((s, i) => (
          <React.Fragment key={s.path}>
            {i > 0 && <span className="bc-sep">›</span>}
            <button
              className={'bc-seg ' + (i === segments.length - 1 ? 'bc-current' : '')}
              onClick={() => onNavigate(s.path)}
              title={s.path}
            >
              {s.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
