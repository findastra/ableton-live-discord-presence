// The Ableton Live Discord Presence artwork: an 8×8 grid of neon pads on black that cycles through ten designs,
// each with its own colours, fading from one to the next.
// One drawing for all three pictures, so they always match: the moving pads on the app's page, the card GIF Discord
// shows, and the still app icon (the GIF's first frame).
// Works in the browser (the page) and in Node (scripts/make-pad-art-20261102.js).

export const GRID = 8;
// Time is counted in sixteenth notes at 125 BPM (120 ms each). Each design plays for two bars.
export const SCENE_STEPS = 32;
const FADE_STEPS = 4;
const BG = [0, 0, 0], OFF = [34, 37, 44];

// Three colours each, laid along the grid's diagonal from the top left to the bottom right.
const PALETTES = {
  synthwave: [[255, 64, 200], [150, 80, 255], [60, 210, 255]],
  aurora: [[40, 255, 170], [60, 200, 255], [150, 110, 255]],
  sunset: [[255, 190, 70], [255, 80, 140], [190, 70, 255]],
  ice: [[210, 245, 255], [90, 200, 255], [70, 120, 255]],
  ultraviolet: [[255, 90, 255], [170, 60, 255], [90, 80, 255]],
  candy: [[255, 110, 190], [255, 210, 100], [90, 230, 255]],
  toxic: [[210, 255, 60], [60, 255, 140], [40, 220, 230]],
  stardust: [[255, 255, 255], [170, 190, 255], [255, 170, 240]],
  love: [[255, 120, 170], [255, 60, 110], [255, 150, 210]],
  ember: [[255, 235, 130], [255, 120, 50], [255, 50, 100]],
};

// Repeatable "random" numbers, so the page, the GIF and the icon always agree.
const rand = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const pulse = age => Math.max(0, 1 - age / 4);
const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

// The drum pattern over one bar of sixteenths: row 7 kick, row 6 snare, row 5 hats, upper rows accents and fills.
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

// The cells in a spiral from the outside in, for the snake.
const SPIRAL = (() => {
  const order = [];
  let top = 0, left = 0, bottom = GRID - 1, right = GRID - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) order.push([top, c]);
    for (let r = top + 1; r <= bottom; r++) order.push([r, right]);
    for (let c = right - 1; c >= left; c--) order.push([bottom, c]);
    for (let r = bottom - 1; r > top; r--) order.push([r, left]);
    top++; left++; bottom--; right--;
  }
  const index = Array.from({ length: GRID }, () => new Array(GRID));
  order.forEach(([r, c], i) => { index[r][c] = i; });
  return index;
})();

const HEART = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'];

// Each design: its palette and how bright pad (r, c) is at step s (0 to SCENE_STEPS) of its two bars.
export const SCENES = [
  // First, so the card's first frame and the app icon are the rainbow swirl (Astra, 2026-11-03).
  { name: 'rainbow swirl', palette: 'rainbow', light(r, c, s) {
    const angle = Math.atan2(r - 3.5, c - 3.5), d = Math.hypot(r - 3.5, c - 3.5);
    return 0.08 + 0.92 * (0.5 + 0.5 * Math.cos(2 * angle - d * 1.5 - s * 0.35)) ** 3;
  } },
  { name: 'drums', palette: 'synthwave', light(r, c, s) {
    const phase = (r + c) / 2 - s * 0.5;
    let b = 0.55 * Math.abs(Math.cos(phase * Math.PI / 6)) ** 1.2;
    for (let back = 0; back < 4; back++) {
      const step = Math.floor(s) - back;
      if (step < 0) break;
      if (hits(step % 16).some(([hr, hc]) => hr === r && hc === c)) b = Math.max(b, pulse(s - step));
    }
    return b;
  } },
  { name: 'ripple', palette: 'aurora', light(r, c, s) {
    const d = Math.hypot(r - 3.5, c - 3.5), age = s % 8, ring = age * 0.85;
    return 0.1 + 0.9 * Math.max(0, 1 - Math.abs(d - ring) * 1.1) * (1 - age / 9);
  } },
  { name: 'equalizer', palette: 'sunset', light(r, c, s) {
    const beat = Math.floor(s / 2), f = s / 2 - beat;
    const height = 1 + 7 * (rand(c * 31 + beat) * (1 - f) + rand(c * 31 + beat + 1) * f);
    const level = GRID - r;
    return level <= height ? 0.45 + 0.55 * (level / height) : 0.06;
  } },
  { name: 'rain', palette: 'ice', light(r, c, s) {
    const head = (s * 0.75 + rand(c + 5) * 11) % 11 - 1.5;
    const behind = head - r;
    return behind >= 0 && behind < 3.5 ? (1 - behind / 3.5) ** 1.5 : 0.05;
  } },
  { name: 'checker', palette: 'candy', light(r, c, s) {
    const beat = Math.floor(s / 4);
    return (r + c + beat) % 2 ? 0.25 + 0.75 * pulse(s % 4) : 0.12;
  } },
  { name: 'snake', palette: 'toxic', light(r, c, s) {
    const head = (s * 2) % 64, age = (head - SPIRAL[r][c] + 64) % 64;
    return age < 12 ? 1 - age / 12 : 0.05;
  } },
  { name: 'twinkle', palette: 'stardust', light(r, c, s) {
    return 0.05 + 0.95 * Math.max(0, Math.sin(s * 0.55 + rand(r * 8 + c) * 6.283)) ** 6;
  } },
  { name: 'heart', palette: 'love', light(r, c, s) {
    const beat = pulse(s % 4) * (s % 8 < 4 ? 1 : 0.6);
    return HEART[r][c] === '1' ? 0.5 + 0.5 * beat : 0.04 + 0.12 * beat;
  } },
  { name: 'burst', palette: 'ember', light(r, c, s) {
    const n = Math.floor(s / 4), age = s % 4;
    const cr = Math.floor(rand(n * 7) * GRID), cc = Math.floor(rand(n * 13) * GRID);
    const d = Math.hypot(r - cr, c - cc);
    return 0.06 + 0.94 * Math.max(0, 1 - Math.abs(d - age * 1.6) * 0.9) * (1 - age / 5);
  } },
];
export const LOOP_STEPS = SCENES.length * SCENE_STEPS;

function mix(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
function paletteAt(name, x) {
  const p = PALETTES[name];
  return x < 0.5 ? mix(p[0], p[1], x * 2) : mix(p[1], p[2], x * 2 - 1);
}
// The rainbow swirl's colours go round the centre and slowly turn.
function rainbowAt(r, c, s) {
  const hue = ((Math.atan2(r - 3.5, c - 3.5) / (2 * Math.PI) + 0.5 + Math.hypot(r - 3.5, c - 3.5) * 0.06 - s * 0.012) % 1 + 1) % 1;
  const k = n => { const v = (n + hue * 6) % 6; return 255 * (1 - 0.72 * Math.max(0, Math.min(v, 4 - v, 1))); };
  return [k(5), k(3), k(1)];
}
const colorAt = (scene, r, c, s) => scene.palette === 'rainbow' ? rainbowAt(r, c, s) : paletteAt(scene.palette, (r + c) / (2 * GRID - 2));

// Brightness and colour of every pad at time t (in sixteenths, any real number). The last four steps of each design
// fade into the next.
export function padState(t) {
  const loop = ((t % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS;
  const index = Math.floor(loop / SCENE_STEPS), s = loop - index * SCENE_STEPS;
  const scene = SCENES[index], next = SCENES[(index + 1) % SCENES.length];
  const w = smooth((s - (SCENE_STEPS - FADE_STEPS)) / FADE_STEPS);
  const bright = [], color = [];
  for (let r = 0; r < GRID; r++) {
    bright.push([]); color.push([]);
    for (let c = 0; c < GRID; c++) {
      let b = scene.light(r, c, s), col = colorAt(scene, r, c, s);
      if (w > 0) {
        b = b * (1 - w) + next.light(r, c, s - SCENE_STEPS) * w;
        col = mix(col, colorAt(next, r, c, s - SCENE_STEPS), w);
      }
      bright[r].push(Math.max(0, Math.min(1, b)));
      color[r].push(col);
    }
  }
  return { bright, color };
}
export const lights = t => padState(t).bright;

// Distance from a point to a rounded square centred on 0,0 (negative inside).
function boxDistance(px, py, half, radius) {
  const qx = Math.abs(px) - half + radius, qy = Math.abs(py) - half + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

// Draws one frame into `out` (RGBA, size×size×4). Everything scales with size, so 160, 448 and 1024 look alike.
// `fill` is how much of the square the grid takes: the page shrinks it with CSS, the card and icon draw it at
// CARD_FILL so it sits smaller in Discord's square (Astra, 2026-11-03).
export const CARD_FILL = 0.76;
export function drawPads(out, size, t, fill = 1) {
  const { bright, color } = padState(t);
  const unit = size / 1024 * fill;
  const margin = (size - 944 * unit) / 2, cell = 118 * unit, half = 44 * unit, radius = 6 * unit;
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
          const b = bright[r][c];
          if (b < 0.02) continue;
          const d = boxDistance(fx - (margin + (c + 0.5) * cell), fy - (margin + (r + 0.5) * cell), half, radius);
          if (d <= 0) continue;
          const glow = b * 0.6 * Math.exp(-d / glowFall), hue = color[r][c];
          r0 += hue[0] * glow; g0 += hue[1] * glow; b0 += hue[2] * glow;
        }
      }
      // The pad: lit body, a hot white-ish centre and a bright rim, with a soft anti-aliased edge.
      if (col >= 0 && row >= 0 && col < GRID && row < GRID) {
        const cx = fx - (margin + (col + 0.5) * cell), cy = fy - (margin + (row + 0.5) * cell);
        const d = boxDistance(cx, cy, half, radius);
        if (d < 1) {
          const edge = Math.min(1, 1 - d), b = bright[row][col], hue = color[row][col];
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
    // About 25 frames a second.
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
