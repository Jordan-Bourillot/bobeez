import React, { useEffect, useState } from 'react';
import { subscribe, dismiss } from '../lib/toast.js';
import Icon from './Icon.jsx';

const TYPE_ICON = {
  success: 'check',
  error: 'close',
  warn: 'info',
  info: 'info',
};

export default function Toaster() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => subscribe(setToasts), []);

  return (
    <div className="toaster">
      {toasts.map(t => (
        <div key={t.id} className={'toast toast-' + t.type} role="status">
          <Icon name={t.icon || TYPE_ICON[t.type]} size={16} className="toast-icon" />
          <span className="toast-msg">{t.message}</span>
          {t.action && (
            <button className="toast-action" onClick={() => { t.action.onClick(); dismiss(t.id); }}>
              {t.action.label}
            </button>
          )}
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fermer">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
