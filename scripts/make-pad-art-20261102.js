// Makes the two picture files from the one drawing in public/pad-art-20261102.js:
//  - public/pad-grid-card-20261102.gif: the moving card picture Discord shows (240×240, every design in turn, at 125 BPM, each frame with its own colours)
//  - public/pad-grid-icon-20261102.png: the still app icon (1024×1024), the card's first frame
// The app's page draws the same thing live. Run: node scripts/make-pad-art-20261102.js
import { writeFileSync, realpathSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { drawPads, LOOP_STEPS, CARD_FILL } from '../public/pad-art-20261102.js';
import { encodeGif } from './gif-encoder-20261102.js';

export const CARD_SIZE = 240, ICON_SIZE = 1024, SUBSTEPS = 2, DELAY = 6; // 2 frames per step, 60 ms each = 125 BPM

export function cardFrames() {
  return Array.from({ length: LOOP_STEPS * SUBSTEPS }, (_, i) => drawPads(new Uint8ClampedArray(CARD_SIZE * CARD_SIZE * 4), CARD_SIZE, i / SUBSTEPS, CARD_FILL));
}

// Median cut: split the colours the frames use into 256 boxes, each box's average is one palette colour.
export function medianCut(frames, count = 256) {
  const weights = new Map();
  for (const rgba of frames) for (let i = 0; i < rgba.length; i += 4) {
    const key = (rgba[i] >> 2) << 12 | (rgba[i + 1] >> 2) << 6 | rgba[i + 2] >> 2;
    weights.set(key, (weights.get(key) || 0) + 1);
  }
  const colors = [...weights].map(([key, w]) => [((key >> 12) & 63) * 4 + 2, ((key >> 6) & 63) * 4 + 2, (key & 63) * 4 + 2, w]);
  let boxes = [colors];
  while (boxes.length < count) {
    let best = -1, bestRange = 0, bestChannel = 0;
    boxes.forEach((box, b) => {
      if (box.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        let lo = 255, hi = 0;
        for (const c of box) { if (c[ch] < lo) lo = c[ch]; if (c[ch] > hi) hi = c[ch]; }
        if (hi - lo > bestRange) { bestRange = hi - lo; best = b; bestChannel = ch; }
      }
    });
    if (best < 0) break;
    const box = boxes[best].sort((a, b) => a[bestChannel] - b[bestChannel]);
    const total = box.reduce((s, c) => s + c[3], 0);
    let run = 0, cut = 1;
    for (; cut < box.length - 1; cut++) { run += box[cut - 1][3]; if (run >= total / 2) break; }
    boxes.splice(best, 1, box.slice(0, cut), box.slice(cut));
  }
  return boxes.map(box => {
    const w = box.reduce((s, c) => s + c[3], 0);
    return [0, 1, 2].map(ch => Math.round(box.reduce((s, c) => s + c[ch] * c[3], 0) / w));
  });
}

export function indexFrames(frames, palette) {
  const cache = new Map();
  return frames.map(rgba => {
    const out = new Uint8Array(rgba.length / 4);
    for (let p = 0, i = 0; i < rgba.length; p++, i += 4) {
      const key = rgba[i] << 16 | rgba[i + 1] << 8 | rgba[i + 2];
      let best = cache.get(key);
      if (best === undefined) {
        let dist = Infinity;
        palette.forEach(([r, g, b], n) => {
          const d = (r - rgba[i]) ** 2 + (g - rgba[i + 1]) ** 2 + (b - rgba[i + 2]) ** 2;
          if (d < dist) { dist = d; best = n; }
        });
        cache.set(key, best);
      }
      out[p] = best;
    }
    return out;
  });
}

// Each frame gets its own 256 colours, with true black always first, so the gaps between pads stay black and the
// pads never smear into one square (Astra, 2026-11-03).
export function makeCardGif() {
  const frames = cardFrames();
  const palettes = frames.map(frame => [[0, 0, 0], ...medianCut([frame], 255)]);
  const indexed = frames.map((frame, f) => indexFrames([frame], palettes[f])[0]);
  return encodeGif(CARD_SIZE, CARD_SIZE, palettes[0], indexed, DELAY, palettes);
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
export function makeIconPng() {
  const rgba = drawPads(new Uint8ClampedArray(ICON_SIZE * ICON_SIZE * 4), ICON_SIZE, 0, CARD_FILL);
  const rows = Buffer.alloc((ICON_SIZE * 3 + 1) * ICON_SIZE);
  for (let y = 0; y < ICON_SIZE; y++) for (let x = 0; x < ICON_SIZE; x++) {
    const o = y * (ICON_SIZE * 3 + 1) + 1 + x * 3, i = (y * ICON_SIZE + x) * 4;
    rows[o] = rgba[i]; rows[o + 1] = rgba[i + 1]; rows[o + 2] = rgba[i + 2];
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(ICON_SIZE, 0); head.writeUInt32BE(ICON_SIZE, 4); head[8] = 8; head[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Compare real paths: the PetOS folder is reached through a junction.
const real = path => { try { return realpathSync(path).toLowerCase(); } catch { return ''; } };
if (process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1])) {
  for (const [name, make] of [['pad-grid-card-20261102.gif', makeCardGif], ['pad-grid-icon-20261102.png', makeIconPng]]) {
    const out = fileURLToPath(new URL('../public/' + name, import.meta.url));
    const data = make();
    writeFileSync(out, data);
    console.log(`Wrote ${out} (${data.length} bytes)`);
  }
}
