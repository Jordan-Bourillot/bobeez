import React from 'react';
import { M } from '../mascot.js';

export default function FlyingMascot({ pose = 'happy' }) {
  return (
    <div className="flying-mascot" aria-hidden="true">
      <div className="fm-orbit">
        <img src={M[pose] || M.happy} alt="" className="fm-img" draggable={false} />
      </div>
    </div>
  );
}
