import React, { useEffect, useState } from 'react';
import { subscribe } from '../lib/mascotReact.js';
import { M } from '../mascot.js';

export default function MascotReactions() {
  const [reactions, setReactions] = useState([]);
  useEffect(() => subscribe(({ type, ev, id }) => {
    if (type === 'add') setReactions(r => [...r, ev]);
    else if (type === 'remove') setReactions(r => r.filter(x => x.id !== id));
  }), []);

  return (
    <div className="mascot-reactions" aria-hidden>
      {reactions.map(r => {
        const left = r.x ?? (window.innerWidth - 200);
        const top = r.y ?? 80;
        return (
          <div key={r.id} className="mascot-react" style={{ left, top }}>
            <img src={M[r.pose] || M.happy} alt="" />
            {r.text && <div className="mascot-react-text">{r.text}</div>}
          </div>
        );
      })}
    </div>
  );
}
