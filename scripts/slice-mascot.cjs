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
  // 1. Load image, ensure RGBA, threshold near-white pixels to transparent.
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  data.copy(out);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    if (r > 240 && g > 240 && b > 240) {
      out[i + 3] = 0;
    }
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
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
