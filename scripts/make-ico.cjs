const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('node:fs');
const path = require('node:path');

// Use the happy head-only pose so the icon stays readable at 16/24/32 px.
// The icon is composited on a SOLID WHITE background to avoid:
//   1. transparent teeth inside the open mouth (the white pixels were killed
//      by the slice-mascot transparency threshold).
//   2. taskbar showing the desktop wallpaper through the icon.
const SRC = path.join(__dirname, '..', 'src', 'assets', 'mascot', 'happy.png');
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets');
const ICO_OUT = path.join(OUT_DIR, 'bobeez.ico');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function main() {
  // 1. Trim transparent borders so the head fills the canvas at small sizes.
  const trimmed = await sharp(SRC)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .toBuffer();
  console.log('✓ trimmed transparent borders');

  const tmpFiles = [];
  for (const size of SIZES) {
    // 6% padding so the head doesn't kiss the icon edges.
    const inner = Math.round(size * 0.92);
    const innerHead = await sharp(trimmed)
      .resize(inner, inner, { fit: 'contain', background: WHITE })
      .toBuffer();

    // Compose head onto a SOLID WHITE square of the target size.
    const buf = await sharp({
        create: { width: size, height: size, channels: 3, background: WHITE },
      })
      .composite([{
        input: innerHead,
        top: Math.floor((size - inner) / 2),
        left: Math.floor((size - inner) / 2),
      }])
      .png()
      .toBuffer();

    const tmp = path.join(OUT_DIR, `_ico-${size}.png`);
    fs.writeFileSync(tmp, buf);
    tmpFiles.push(tmp);
    console.log(`✓ rendered ${size}×${size} (white background, no transparency)`);
  }

  const icoBuf = await pngToIco(tmpFiles);
  fs.writeFileSync(ICO_OUT, icoBuf);
  console.log(`\n✓ ${ICO_OUT}  (${(icoBuf.length / 1024).toFixed(1)} KB)`);

  for (const f of tmpFiles) fs.unlinkSync(f);
}

main().catch(e => { console.error(e); process.exit(1); });
