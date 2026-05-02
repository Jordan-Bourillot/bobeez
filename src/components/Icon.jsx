import React from 'react';

const ICONS = {
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z',
  open: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2H3V7Z M3 9h18l-1.5 9.5A2 2 0 0 1 17.5 20h-11A2 2 0 0 1 4.5 18.5L3 9Z',
  refresh: 'M21 12a9 9 0 1 1-3.2-6.9 M21 4v5h-5',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-5.4-5.4',
  star: 'M12 2.5l3 6.4 7 .8-5.2 4.9 1.4 7L12 18.3l-6.2 3.3 1.4-7L2 9.7l7-.8z',
  trash: 'M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6',
  rotateLeft: 'M3 12a9 9 0 1 0 3-6.7 M3 4v5h5',
  rotateRight: 'M21 12a9 9 0 1 1-3-6.7 M21 4v5h-5',
  zoomIn: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-5.4-5.4 M11 7v8 M7 11h8',
  zoomOut: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-5.4-5.4 M7 11h8',
  fit: 'M4 9V5a1 1 0 0 1 1-1h4 M20 9V5a1 1 0 0 0-1-1h-4 M4 15v4a1 1 0 0 0 1 1h4 M20 15v4a1 1 0 0 1-1 1h-4',
  play: 'M5 4l14 8-14 8z',
  pause: 'M6 4h4v16H6z M14 4h4v16h-4z',
  prev: 'M15 18l-6-6 6-6',
  next: 'M9 6l6 6-6 6',
  up: 'M12 19V5 M5 12l7-7 7 7',
  back: 'M19 12H5 M12 5l-7 7 7 7',
  forward: 'M5 12h14 M12 19l7-7-7-7',
  fullscreen: 'M4 9V5a1 1 0 0 1 1-1h4 M20 9V5a1 1 0 0 0-1-1h-4 M4 15v4a1 1 0 0 0 1 1h4 M20 15v4a1 1 0 0 1-1 1h-4',
  fullscreenExit: 'M9 4v4a1 1 0 0 1-1 1H4 M15 4v4a1 1 0 0 0 1 1h4 M9 20v-4a1 1 0 0 0-1-1H4 M15 20v-4a1 1 0 0 1 1-1h4',
  panelLeft: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z M9 3v18',
  panelRight: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z M15 3v18',
  edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  info: 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z M12 16v-5 M12 8v.01',
  copy: 'M9 9h12v12H9zM5 15H3V3h12v2',
  reveal: 'M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2 M9 14l3-3 3 3 M12 11v8',
  rename: 'M14 2v6h6 M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8 M9 14l2 2 4-4',
  external: 'M14 3h7v7 M21 3l-9 9 M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6',
  download: 'M12 3v13 M5 12l7 7 7-7 M3 21h18',
  filter: 'M3 4h18l-7 9v6l-4 2v-8z',
  sort: 'M3 6h18 M3 12h12 M3 18h6',
  settings: 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z',
  help: 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3 M12 17v.01',
  close: 'M18 6L6 18 M6 6l12 12',
  check: 'M5 12l5 5L20 7',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  flipH: 'M3 12h18 M12 6V3 M12 21v-3 M7 6l-4 6 4 6 M17 6l4 6-4 6',
  flipV: 'M12 3v18 M6 12H3 M21 12h-3 M6 7l6-4 6 4 M6 17l6 4 6-4',
  history: 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z M12 7v5l3 3',
  compare: 'M3 4h7v16H3zM14 4h7v16h-7z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
};

export default function Icon({ name, size = 18, stroke = 'currentColor', strokeWidth = 1.8, fill = 'none', className = '', ...rest }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      className={'icon ' + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + seg} />
      ))}
    </svg>
  );
}
