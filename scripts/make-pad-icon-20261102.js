// Draws the app icon: a still, close-up 8×8 neon pad grid at 1024×1024, full colour with glow.
// The card's moving picture (make-pad-grid-20261102.js) uses the same rows and colours.
// Run: node scripts/make-pad-icon-20261102.js
import { writeFileSync, realpathSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const ICON_SIZE = 1024;
const GRID = 8, MARGIN = 40, CELL = (ICON_SIZE - MARGIN * 2) / GRID, PAD = 100, RADIUS = 18;
const BG = [22, 24, 28], OFF = [42, 46, 52];
const HUES = [[255, 79, 216], [176, 92, 255], [79, 216, 255], [57, 255, 136], [255, 225, 79], [255, 140, 66], [79, 216, 255], [57, 255, 136]];

// How bright each pad is: a lit diagonal wave with a full kick row and a few sparks, like mid-beat.
export function lights() {
  return Array.from({ length: GRID }, (_, r) => Array.from({ length: GRID }, (_, c) => {
    if (r === 7) return c % 2 === 0 ? 1 : 0.55;
    const wave = 1 - Math.abs(((r + c) % 8) - 3) / 3;
    const spark = (r * 5 + c * 3) % 7 === 0 ? 0.9 : 0;
    return Math.max(0, Math.round(Math.max(wave, spark) * 4) / 4);
  }));
}

function crcTable() {
  return Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
}
const CRC = crcTable();
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
export function encodePng(width, height, rgb) {
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) rgb.copy(rows, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  const head = Buffer.alloc(13);
  head.writeUInt32BE(width, 0); head.writeUInt32BE(height, 4); head[8] = 8; head[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Distance from a point to a rounded square pad (negative inside).
function padDistance(px, py) {
  const half = PAD / 2 - RADIUS;
  const qx = Math.abs(px) - half, qy = Math.abs(py) - half;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - RADIUS;
}

export function drawIcon() {
  const light = lights();
  const rgb = Buffer.alloc(ICON_SIZE * ICON_SIZE * 3);
  for (let y = 0; y < ICON_SIZE; y++) {
    for (let x = 0; x < ICON_SIZE; x++) {
      let color = [...BG];
      // Glow from the nearby pads, added like light.
      const col = Math.floor((x - MARGIN) / CELL), row = Math.floor((y - MARGIN) / CELL);
      for (let r = row - 1; r <= row + 1; r++) for (let c = col - 1; c <= col + 1; c++) {
        if (r < 0 || c < 0 || r >= GRID || c >= GRID || !light[r][c]) continue;
        const d = padDistance(x - (MARGIN + (c + 0.5) * CELL), y - (MARGIN + (r + 0.5) * CELL));
        if (d <= 0) continue;
        const glow = light[r][c] * 0.55 * Math.exp(-d / 9);
        color = color.map((v, i) => v + HUES[r][i] * glow);
      }
      // The pad itself, with a soft edge, a lit body and a hot centre.
      if (col >= 0 && row >= 0 && col < GRID && row < GRID) {
        const cx = x - (MARGIN + (col + 0.5) * CELL), cy = y - (MARGIN + (row + 0.5) * CELL);
        const d = padDistance(cx, cy);
        if (d < 1) {
          const edge = Math.min(1, 1 - d);
          const b = light[row][col];
          const hot = b * Math.max(0, 1 - Math.hypot(cx, cy) / (PAD * 0.62));
          let fill = OFF.map((v, i) => v + (HUES[row][i] - v) * b);
          fill = fill.map(v => v + (250 - v) * hot * hot * 0.55);
          // A thin bright rim on lit pads, a faint one on dark pads.
          if (d > -5) fill = fill.map((v, i) => v + (b ? HUES[row][i] * 0.35 : 14));
          color = color.map((v, i) => v + (fill[i] - v) * edge);
        }
      }
      const o = (y * ICON_SIZE + x) * 3;
      for (let i = 0; i < 3; i++) rgb[o + i] = Math.max(0, Math.min(255, Math.round(color[i])));
    }
  }
  return encodePng(ICON_SIZE, ICON_SIZE, rgb);
}

// Compare real paths: the PetOS folder is reached through a junction.
const real = path => { try { return realpathSync(path).toLowerCase(); } catch { return ''; } };
if (process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1])) {
  const out = fileURLToPath(new URL('../public/pad-grid-icon-20261102.png', import.meta.url));
  const png = drawIcon();
  writeFileSync(out, png);
  console.log(`Wrote ${out} (${png.length} bytes)`);
}
