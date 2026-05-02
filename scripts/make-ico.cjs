const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('node:fs');
const path = require('node:path');

// Source = happy mascot, head only. The flood-fill in slice-mascot.cjs
// keeps internal whites (teeth, eye highlights) opaque while the outer
// background is transparent — so we use it AS-IS without compositing.
const SRC = path.join(__dirname, '..', 'src', 'assets', 'mascot', 'happy.png');
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets');
const ICO_OUT = path.join(OUT_DIR, 'bobeez.ico');
const SIZES = [16, 24, 32, 48, 64, 128, 256];
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function main() {
  // Trim transparent borders so the head fills the canvas at small sizes.
  const trimmed = await sharp(SRC)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .toBuffer();
  console.log('✓ trimmed transparent borders');

  const tmpFiles = [];
  for (const size of SIZES) {
    // 6% padding so the head doesn't kiss the icon edges. Keep transparent
    // background — Windows draws the icon over the taskbar / desktop bg.
    const inner = Math.round(size * 0.92);
    const buf = await sharp(trimmed)
      .resize(inner, inner, { fit: 'contain', background: TRANSPARENT })
      .extend({
        top: Math.floor((size - inner) / 2),
        bottom: Math.ceil((size - inner) / 2),
        left: Math.floor((size - inner) / 2),
        right: Math.ceil((size - inner) / 2),
        background: TRANSPARENT,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const tmp = path.join(OUT_DIR, `_ico-${size}.png`);
    fs.writeFileSync(tmp, buf);
    tmpFiles.push(tmp);
    console.log(`✓ rendered ${size}×${size} (transparent bg, white teeth)`);
  }

  const icoBuf = await pngToIco(tmpFiles);
  fs.writeFileSync(ICO_OUT, icoBuf);
  console.log(`\n✓ ${ICO_OUT}  (${(icoBuf.length / 1024).toFixed(1)} KB)`);

  for (const f of tmpFiles) fs.unlinkSync(f);
}

main().catch(e => { console.error(e); process.exit(1); });
