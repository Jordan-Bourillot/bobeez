import React, { useState } from 'react';
import Icon from './Icon.jsx';

const SESSION_DISMISS_KEY = 'bobeez.beta-banner.dismissed';
const FEEDBACK_EMAIL = 'contact@triskell-studio.fr';

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(SESSION_DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  };

  const openMail = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent('Bobeez bêta — Mon retour');
    const body = encodeURIComponent(
      'Bonjour,\n\n' +
      'Mon retour sur la bêta de Bobeez :\n\n' +
      '— \n\n' +
      '(Version, OS et description du contexte si pertinent)\n'
    );
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    try { window.bobeez.openExternal?.(url); } catch {}
  };

  return (
    <div className="beta-banner" role="status" aria-label="Bobeez est en version bêta">
      <span className="bb-flask">🧪</span>
      <span className="bb-tag">BÊTA</span>
      <span className="bb-muted">·  Vos retours sont précieux :</span>
      <button className="bb-mail" onClick={openMail} title={`Écrire à ${FEEDBACK_EMAIL}`}>
        <Icon name="external" size={11} /> {FEEDBACK_EMAIL}
      </button>
      <button className="bb-close" onClick={dismiss} title="Masquer pour cette session">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
