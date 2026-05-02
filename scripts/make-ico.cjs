const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'src', 'assets', 'mascot', 'logo.png');
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets');
const ICO_OUT = path.join(OUT_DIR, 'bobeez.ico');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  const tmpFiles = [];
  for (const size of SIZES) {
    const buf = await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const tmp = path.join(OUT_DIR, `_ico-${size}.png`);
    fs.writeFileSync(tmp, buf);
    tmpFiles.push(tmp);
    console.log(`✓ rendered ${size}×${size}`);
  }

  const icoBuf = await pngToIco(tmpFiles);
  fs.writeFileSync(ICO_OUT, icoBuf);
  console.log(`\n✓ ${ICO_OUT}  (${(icoBuf.length / 1024).toFixed(1)} KB)`);

  for (const f of tmpFiles) fs.unlinkSync(f);
}

main().catch(e => { console.error(e); process.exit(1); });
