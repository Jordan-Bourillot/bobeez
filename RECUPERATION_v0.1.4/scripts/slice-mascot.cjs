const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');

const SRC = path.join(__dirname, '..', 'Logos.jpg');
const OUT = path.join(__dirname, '..', 'src', 'assets', 'mascot');
fs.mkdirSync(OUT, { recursive: true });

const W = 1024, H = 559;
const TITLE_H = 90;       // title bar takes ~90px (BOBEEZ - PERSONNAGE EXPLORATEUR…)
const LABEL_H = 50;       // label under each character (~50px)
const ROW_H = (H - TITLE_H) / 2;
const CHAR_H = ROW_H - LABEL_H;
const CELL_W = W / 5;
const PADDING = 6;

const NAMES = [
  'base', 'happy', 'pensive', 'folder', 'shocked',
  'photos', 'shocked2', 'binoculars', 'angry', 'notebook',
];

async function makeTransparent(input, outPath) {
  // Flood-fill from the borders: only background pixels CONNECTED to the
  // outer edge become transparent. Internal whites (teeth, eye highlights)
  // surrounded by darker outlines stay opaque.
  const THRESHOLD = 235;  // a pixel is "background" if R, G, B all >= threshold
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);
  const visited = new Uint8Array(w * h);
  const stack = [];

  const isBg = (bi) => out[bi] >= THRESHOLD && out[bi + 1] >= THRESHOLD && out[bi + 2] >= THRESHOLD;
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const bi = i * 4;
    if (!isBg(bi)) return;
    visited[i] = 1;
    stack.push(i);
  };

  // Seed from all border pixels (handles backgrounds that aren't perfectly
  // square — i.e. mascot touches one edge but not others).
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }

  while (stack.length) {
    const i = stack.pop();
    out[i * 4 + 3] = 0;  // make transparent
    const x = i % w;
    const y = (i / w) | 0;
    seed(x + 1, y);
    seed(x - 1, y);
    seed(x, y + 1);
    seed(x, y - 1);
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const idx = row * 5 + col;
      const name = NAMES[idx];
      const left = Math.round(col * CELL_W + PADDING);
      const top = Math.round(TITLE_H + row * ROW_H);
      const width = Math.round(CELL_W - PADDING * 2);
      const height = Math.round(CHAR_H);

      const tmp = path.join(OUT, `_tmp-${name}.png`);
      await sharp(SRC).extract({ left, top, width, height }).png().toFile(tmp);
      await makeTransparent(tmp, path.join(OUT, `${name}.png`));
      fs.unlinkSync(tmp);
      console.log(`✓ ${name}.png  (${width}×${height})`);
    }
  }

  // Tight logo from the base pose
  const baseTmp = path.join(OUT, '_tmp-logo.png');
  const left = Math.round(0 * CELL_W + 12);
  const top = TITLE_H + 4;
  const width = Math.round(CELL_W - 24);
  const height = Math.round(CHAR_H - 4);
  await sharp(SRC).extract({ left, top, width, height }).png().toFile(baseTmp);
  await makeTransparent(baseTmp, path.join(OUT, 'logo.png'));
  fs.unlinkSync(baseTmp);
  console.log('✓ logo.png');

  console.log('\nDone — sliced into', NAMES.length + 1, 'files at', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
