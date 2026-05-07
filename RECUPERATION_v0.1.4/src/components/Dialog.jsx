import React, { useEffect, useState, useRef } from 'react';
import { subscribe } from '../lib/dialog.js';
import { M } from '../mascot.js';

export default function Dialog() {
  const [d, setD] = useState(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => subscribe(d => {
    setD(d);
    setValue(d?.defaultValue || '');
    setError(null);
  }), []);

  useEffect(() => {
    if (d?.type === 'prompt' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [d]);

  useEffect(() => {
    if (!d) return;
    const onKey = (e) => {
      if (e.key === 'Escape') d.resolve(d.type === 'prompt' ? null : false);
      else if (e.key === 'Enter' && d.type === 'confirm') d.resolve(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d]);

  if (!d) return null;

  const submit = () => {
    if (d.type === 'confirm') return d.resolve(true);
    if (d.validate) {
      const err = d.validate(value);
      if (err) { setError(err); return; }
    }
    d.resolve(value);
  };
  const cancel = () => d.resolve(d.type === 'prompt' ? null : false);

  const mascot = M[d.icon] || M.pensive;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) cancel(); }}>
      <div className={'modal ' + (d.danger ? 'modal-danger' : '')}>
        <div className="modal-mascot">
          <img src={mascot} alt="" />
        </div>
        <div className="modal-body">
          <h3>{d.title}</h3>
          <p>{d.message}</p>
          {d.type === 'prompt' && (
            <>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => { setValue(e.target.value); setError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              />
              {error && <p className="modal-error">{error}</p>}
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={cancel}>{d.cancelLabel}</button>
          <button
            className={'btn ' + (d.danger ? 'danger' : 'primary')}
            onClick={submit}
            autoFocus={d.type === 'confirm'}
          >
            {d.okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
