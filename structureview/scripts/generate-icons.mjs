/**
 * Generate all required icon assets for Windows (NSIS + APPX) from build/icon.png.
 *
 * Outputs:
 *   build/icon.ico              — multi-size ICO for NSIS installer
 *   build/appx/Square44x44Logo.png
 *   build/appx/Square150x150Logo.png
 *   build/appx/StoreLogo.png    (50x50)
 *   build/appx/Wide310x150Logo.png
 *
 * Usage:  node scripts/generate-icons.mjs
 */

import { Jimp } from 'jimp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const SRC       = path.join(ROOT, 'build', 'icon.png');
const APPX_DIR  = path.join(ROOT, 'build', 'appx');

const APPX_SIZES = [
  { name: 'Square44x44Logo.png',   w: 44,  h: 44  },
  { name: 'Square150x150Logo.png', w: 150, h: 150 },
  { name: 'StoreLogo.png',         w: 50,  h: 50  },
  { name: 'Wide310x150Logo.png',   w: 310, h: 150 },
];

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function run() {
  await fs.mkdir(APPX_DIR, { recursive: true });

  const src = await Jimp.read(SRC);
  console.log(`Source: ${SRC} (${src.bitmap.width}×${src.bitmap.height})`);

  // APPX PNGs
  for (const { name, w, h } of APPX_SIZES) {
    const out = path.join(APPX_DIR, name);
    const img = src.clone().resize({ w, h });
    await img.write(out);
    console.log(`  ✓ ${name} (${w}×${h})`);
  }

  // ICO — embed multiple sizes as separate PNG frames in ICO format
  // ICO structure: header + directory + image data (PNG-compressed allowed since Vista)
  const frames = await Promise.all(
    ICO_SIZES.map(async (size) => {
      const resized = src.clone().resize({ w: size, h: size });
      return resized.getBuffer('image/png');
    })
  );

  const buf = buildIco(frames, ICO_SIZES);
  const icoPath = path.join(ROOT, 'build', 'icon.ico');
  await fs.writeFile(icoPath, buf);
  console.log(`  ✓ icon.ico (${ICO_SIZES.join(', ')} px)`);

  console.log('\nDone. All icon assets written to build/');
}

/**
 * Build a minimal ICO file from an array of PNG buffers.
 * Each frame is stored as a compressed PNG image (valid since Windows Vista).
 */
function buildIco(frames, sizes) {
  const HEADER_SIZE    = 6;
  const DIR_ENTRY_SIZE = 16;
  const headerBuf      = Buffer.alloc(HEADER_SIZE);
  const n              = frames.length;

  headerBuf.writeUInt16LE(0, 0); // reserved
  headerBuf.writeUInt16LE(1, 2); // type: ICO
  headerBuf.writeUInt16LE(n, 4); // image count

  const dirBuf = Buffer.alloc(n * DIR_ENTRY_SIZE);
  let offset   = HEADER_SIZE + n * DIR_ENTRY_SIZE;

  for (let i = 0; i < n; i++) {
    const size = sizes[i];
    const len  = frames[i].length;
    const dim  = size >= 256 ? 0 : size; // 0 means 256 in ICO spec

    dirBuf.writeUInt8(dim, i * DIR_ENTRY_SIZE + 0);  // width
    dirBuf.writeUInt8(dim, i * DIR_ENTRY_SIZE + 1);  // height
    dirBuf.writeUInt8(0,   i * DIR_ENTRY_SIZE + 2);  // color count (0 = no palette)
    dirBuf.writeUInt8(0,   i * DIR_ENTRY_SIZE + 3);  // reserved
    dirBuf.writeUInt16LE(1, i * DIR_ENTRY_SIZE + 4); // color planes
    dirBuf.writeUInt16LE(32, i * DIR_ENTRY_SIZE + 6); // bits per pixel
    dirBuf.writeUInt32LE(len,    i * DIR_ENTRY_SIZE + 8);  // image size
    dirBuf.writeUInt32LE(offset, i * DIR_ENTRY_SIZE + 12); // image offset

    offset += len;
  }

  return Buffer.concat([headerBuf, dirBuf, ...frames]);
}

run().catch((err) => { console.error(err); process.exit(1); });
