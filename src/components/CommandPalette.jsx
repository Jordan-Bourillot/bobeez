import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';

function fuzzyScore(query, text) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 + (50 - Math.min(50, t.indexOf(q)));
  // letter-by-letter subseq match
  let qi = 0, score = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { score += 1; qi++; }
  }
  return qi === q.length ? score : -1;
}

export default function CommandPalette({ open, commands, onClose }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!q) return commands.slice(0, 30);
    return commands
      .map(c => ({ c, s: Math.max(fuzzyScore(q, c.label), c.keywords ? fuzzyScore(q, c.keywords) : -1) }))
      .filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map(x => x.c);
  }, [q, commands]);

  useEffect(() => { setIdx(0); }, [q]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[idx];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  if (!open) return null;

  const onKey = (e) => {
    if (e.key === 'Escape') { onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(filtered.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[idx];
      if (c) { onClose(); setTimeout(() => c.run(), 0); }
    }
  };

  // Group by section
  const grouped = filtered.reduce((acc, c) => {
    const s = c.section || 'Actions';
    (acc[s] = acc[s] || []).push(c);
    return acc;
  }, {});

  let runIdx = 0;
  return (
    <div className="cmdk-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk">
        <div className="cmdk-input">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tape une commande, un dossier, une action…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <kbd className="cmdk-kbd">Esc</kbd>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="cmdk-empty">Aucun résultat pour "{q}"</div>
          )}
          {Object.entries(grouped).map(([section, items]) => (
            <React.Fragment key={section}>
              <div className="cmdk-section">{section}</div>
              {items.map(c => {
                const i = runIdx++;
                return (
                  <button
                    key={c.id}
                    className={'cmdk-item ' + (i === idx ? 'active' : '')}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => { onClose(); setTimeout(() => c.run(), 0); }}
                  >
                    {c.icon && <Icon name={c.icon} size={16} className="cmdk-icon" />}
                    <span className="cmdk-label">{c.label}</span>
                    {c.hint && <span className="cmdk-hint">{c.hint}</span>}
                    {c.shortcut && <kbd className="cmdk-kbd">{c.shortcut}</kbd>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="cmdk-footer">
          <span><kbd>↑↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> exécuter</span>
          <span><kbd>Esc</kbd> fermer</span>
        </div>
      </div>
    </div>
  );
}
