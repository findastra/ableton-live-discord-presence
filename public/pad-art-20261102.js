// The Ableton Live Discord Presence artwork: an 8×8 grid of neon pads on graphite, playing a two-bar drum pattern
// while a soft wave of light crosses it. One drawing for all three pictures, so they always match:
// the moving pads on the app's page, the card GIF Discord shows, and the still app icon (the GIF's first frame).
// Works in the browser (the page) and in Node (scripts/make-pad-art-20261102.js).

export const GRID = 8;
export const STEPS = 16;
const BG = [16, 18, 22], OFF = [40, 44, 50];
// One neon colour per row, top to bottom.
export const HUES = [[255, 79, 216], [176, 92, 255], [79, 216, 255], [57, 255, 136], [255, 225, 79], [255, 140, 66], [79, 216, 255], [57, 255, 136]];

// Which pads each sixteenth note hits: row 7 kick, row 6 snare, row 5 hats, upper rows accents and fills.
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

// How bright each pad is at time t (in sixteenth notes, any real number): each hit flashes to full and fades over
// four steps, and a diagonal wave keeps the whole grid glowing between hits.
export function lights(t) {
  const step = ((t % STEPS) + STEPS) % STEPS;
  const grid = Array.from({ length: GRID }, (_, r) => Array.from({ length: GRID }, (_, c) => {
    const phase = (r + c) / 2 - step * 0.5;
    return 0.85 * Math.abs(Math.cos(phase * Math.PI / 6)) ** 1.2;
  }));
  for (let back = 0; back < 4; back++) {
    const s = Math.floor(step) - back;
    const age = step - Math.floor(step) + back;
    for (const [r, c] of hits((s + STEPS) % STEPS)) grid[r][c] = Math.max(grid[r][c], Math.max(0, 1 - age / 4));
  }
  return grid;
}

// Distance from a point to a rounded square centred on 0,0 (negative inside).
function boxDistance(px, py, half, radius) {
  const qx = Math.abs(px) - half + radius, qy = Math.abs(py) - half + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

// Draws one frame into `out` (RGBA, size×size×4). Everything scales with size, so 160, 240 and 1024 look alike.
export function drawPads(out, size, t) {
  const light = lights(t);
  const unit = size / 1024;
  const margin = 40 * unit, cell = (size - margin * 2) / GRID, half = 50 * unit, radius = 18 * unit;
  const glowFall = 9 * unit, rim = 5 * unit;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r0 = BG[0], g0 = BG[1], b0 = BG[2];
      const fx = x + 0.5, fy = y + 0.5;
      const col = Math.floor((fx - margin) / cell), row = Math.floor((fy - margin) / cell);
      // Glow from the nearby pads, added like light.
      for (let r = row - 1; r <= row + 1; r++) {
        if (r < 0 || r >= GRID) continue;
        for (let c = col - 1; c <= col + 1; c++) {
          if (c < 0 || c >= GRID) continue;
          const b = light[r][c];
          if (b < 0.02) continue;
          const d = boxDistance(fx - (margin + (c + 0.5) * cell), fy - (margin + (r + 0.5) * cell), half, radius);
          if (d <= 0) continue;
          const glow = b * 0.6 * Math.exp(-d / glowFall);
          const hue = HUES[r];
          r0 += hue[0] * glow; g0 += hue[1] * glow; b0 += hue[2] * glow;
        }
      }
      // The pad: lit body, a hot white-ish centre and a bright rim, with a soft anti-aliased edge.
      if (col >= 0 && row >= 0 && col < GRID && row < GRID) {
        const cx = fx - (margin + (col + 0.5) * cell), cy = fy - (margin + (row + 0.5) * cell);
        const d = boxDistance(cx, cy, half, radius);
        if (d < 1) {
          const edge = Math.min(1, 1 - d), b = light[row][col], hue = HUES[row];
          const hot = b * Math.max(0, 1 - Math.hypot(cx, cy) / (half * 1.25));
          let fr = OFF[0] + (hue[0] - OFF[0]) * b, fg = OFF[1] + (hue[1] - OFF[1]) * b, fb = OFF[2] + (hue[2] - OFF[2]) * b;
          const white = hot * hot * 0.55;
          fr += (250 - fr) * white; fg += (250 - fg) * white; fb += (250 - fb) * white;
          if (d > -rim) {
            const k = 0.2 + 0.35 * b;
            fr += hue[0] * k; fg += hue[1] * k; fb += hue[2] * k;
          }
          r0 += (fr - r0) * edge; g0 += (fg - g0) * edge; b0 += (fb - b0) * edge;
        }
      }
      const o = (y * size + x) * 4;
      out[o] = r0 > 255 ? 255 : r0; out[o + 1] = g0 > 255 ? 255 : g0; out[o + 2] = b0 > 255 ? 255 : b0; out[o + 3] = 255;
    }
  }
  return out;
}

// The page: draws live into every <canvas data-pad-art>, at 125 BPM.
// The <img> beside each canvas stays as the still until the first frame is drawn.
export function startPage(doc = globalThis.document) {
  if (!doc) return;
  const canvases = [...doc.querySelectorAll('canvas[data-pad-art]')];
  if (!canvases.length) return;
  const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const started = performance.now();
  const STEP_MS = 120;
  const views = canvases.map(canvas => {
    const size = Number(canvas.dataset.size) || 384;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    return { canvas, size, ctx, image: ctx.createImageData(size, size) };
  });
  let last = -1;
  const frame = now => {
    const t = still ? 0 : (now - started) / STEP_MS;
    // About 25 frames a second, the same as the card GIF.
    if (t !== last && (last < 0 || Math.abs(t - last) >= 0.33)) {
      last = t;
      for (const view of views) {
        drawPads(view.image.data, view.size, t);
        view.ctx.putImageData(view.image, 0, 0);
        view.canvas.parentElement?.classList.add('official-galaxy-ready');
      }
    }
    if (!still) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if (globalThis.document) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => startPage(), { once: true });
  else startPage();
}
