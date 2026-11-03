// Draws the card picture: an 8×8 grid of neon pads on graphite gray, playing a two-bar drum pattern.
// Original art made in code; no logos. Run: node scripts/make-pad-grid-20261102.js
import { writeFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { encodeGif } from './gif-encoder-20261102.js';

export const SIZE = 320;
const GRID = 8, MARGIN = 24, CELL = (SIZE - MARGIN * 2) / GRID, PAD = 28, RADIUS = 6;
const STEPS = 16, DELAY = 12; // 16 sixteenth notes at about 125 BPM.
const BG = [28, 31, 35], OFF = [44, 49, 55];
// One neon colour per row, top to bottom.
const HUES = [[255, 79, 216], [176, 92, 255], [79, 216, 255], [57, 255, 136], [255, 225, 79], [255, 140, 66], [79, 216, 255], [57, 255, 136]];
const LEVELS = 8;

// Which pads each step hits: row 7 kick, row 6 snare, row 5 hats, upper rows accents and fills.
export function hits(step) {
  const pads = [];
  if (step % 4 === 0) pads.push([7, (step / 4) * 2], [7, (step / 4) * 2 + 1]);
  if (step % 8 === 4) pads.push([6, 2], [6, 3], [6, 4], [6, 5]);
  if (step % 2 === 0) pads.push([5, step / 2]);
  if (step === 14) pads.push([4, 6], [4, 7]);
  if (step >= 12) pads.push([3 - (step - 12) % 4, step - 12 + 4]);
  if (step === 0 || step === 8) pads.push([0, step / 2], [1, step / 2 + 1], [2, step / 2 + 2]);
  if (step === 6 || step === 10) pads.push([1, 7 - (step - 6) / 2], [2, 6 - (step - 6) / 2]);
  return pads;
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function palette() {
  const colors = [BG, OFF];
  for (const hue of HUES) {
    for (let l = 1; l <= LEVELS; l++) colors.push(mix(OFF, hue, l / LEVELS));
    colors.push(mix(hue, [245, 248, 250], 0.2)); // the flash on the hit itself
    for (let l = 1; l <= LEVELS; l++) colors.push(mix(BG, hue, (l / LEVELS) * 0.45)); // glow between pads
  }
  return colors;
}
const PER_HUE = LEVELS * 2 + 1;
const padIndex = (row, level) => 2 + row * PER_HUE + level - 1; // level 1..LEVELS+1 (flash)
const glowIndex = (row, level) => 2 + row * PER_HUE + LEVELS + level; // level 1..LEVELS

// How bright each pad is on one frame: 1 on the hit, fading over the next four steps.
export function brightness(step) {
  const grid = Array.from({ length: GRID }, () => new Array(GRID).fill(0));
  for (let back = 0; back < 5; back++) {
    for (const [r, c] of hits((step - back + STEPS) % STEPS)) grid[r][c] = Math.max(grid[r][c], 1 - back / 5);
  }
  return grid;
}

function insideRounded(x, y) {
  const cx = Math.min(Math.max(x, RADIUS), PAD - RADIUS), cy = Math.min(Math.max(y, RADIUS), PAD - RADIUS);
  return (x - cx) ** 2 + (y - cy) ** 2 <= RADIUS ** 2;
}

export function frame(step) {
  const light = brightness(step);
  const pixels = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const gx = x - MARGIN, gy = y - MARGIN;
      const col = Math.floor(gx / CELL), row = Math.floor(gy / CELL);
      let index = 0;
      if (col >= 0 && col < GRID && row >= 0 && row < GRID) {
        const px = gx - col * CELL - (CELL - PAD) / 2, py = gy - row * CELL - (CELL - PAD) / 2;
        const b = light[row][col];
        if (px >= 0 && py >= 0 && px < PAD && py < PAD && insideRounded(px, py)) {
          index = b === 0 ? 1 : padIndex(row, b === 1 ? LEVELS + 1 : Math.max(1, Math.round(b * LEVELS)));
        } else if (b > 0) {
          const dx = Math.max(-px, px - PAD, 0), dy = Math.max(-py, py - PAD, 0);
          const fall = 1 - Math.hypot(dx, dy) / 4;
          const level = Math.round(b * fall * LEVELS);
          if (level > 0) index = glowIndex(row, level);
        }
      }
      pixels[y * SIZE + x] = index;
    }
  }
  return pixels;
}

export function makeGif() {
  return encodeGif(SIZE, SIZE, palette(), Array.from({ length: STEPS }, (_, s) => frame(s)), DELAY);
}

// Compare real paths: the PetOS folder is reached through a junction.
const real = path => { try { return realpathSync(path).toLowerCase(); } catch { return ''; } };
if (process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1])) {
  const out = fileURLToPath(new URL('../public/pad-grid-card-20261102.gif', import.meta.url));
  const gif = makeGif();
  writeFileSync(out, gif);
  console.log(`Wrote ${out} (${gif.length} bytes)`);
}
