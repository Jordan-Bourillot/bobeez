import React, { useEffect, useRef, useState } from 'react';

export function useContextMenu() {
  const [state, setState] = useState(null); // { x, y, items }
  const open = (e, items) => {
    e.preventDefault();
    e.stopPropagation();
    setState({ x: e.clientX, y: e.clientY, items });
  };
  const close = () => setState(null);
  return { state, open, close };
}

export default function ContextMenu({ state, onClose }) {
  const ref = useRef(null);
  const [adjust, setAdjust] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!state) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [state, onClose]);

  useEffect(() => {
    if (!state || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = state.x + r.width > window.innerWidth ? -r.width : 0;
    const dy = state.y + r.height > window.innerHeight ? -r.height : 0;
    setAdjust({ x: dx, y: dy });
  }, [state]);

  if (!state) return null;

  return (
    <div
      ref={ref}
      className="ctx-menu"
      style={{ left: state.x + adjust.x, top: state.y + adjust.y }}
    >
      {state.items.map((it, i) => {
        if (it === '-' || it.divider) return <div key={i} className="ctx-divider" />;
        return (
          <button
            key={i}
            className={'ctx-item ' + (it.danger ? 'danger' : '') + ' ' + (it.disabled ? 'disabled' : '')}
            disabled={it.disabled}
            onClick={() => {
              if (it.disabled) return;
              onClose();
              it.onClick?.();
            }}
          >
            {it.icon && <span className="ctx-icon">{it.icon}</span>}
            <span className="ctx-label">{it.label}</span>
            {it.shortcut && <span className="ctx-shortcut">{it.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
