import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseTitle, activity, validateConfig, Presence, PAD_GRID_URL, BUILT_IN_CLIENT_ID } from '../src/card-20261102.js';
import { readProbe, probeScript, detectAbleton } from '../src/detector-20261102.js';
import { setStartup, startupEnabled, LAUNCHER_NAME } from '../src/windows-startup-20261102.js';
import { encodeGif } from '../scripts/gif-encoder-20261102.js';
import { makeCardGif, makeIconPng, cardFrames, CARD_SIZE } from '../scripts/make-pad-art-20261102.js';
import { drawPads, lights, SCENES, SCENE_STEPS, CARD_FILL } from '../public/pad-art-20261102.js';

test('reads the set name and Live edition from the window title', () => {
  assert.deepEqual(parseTitle('Night Drive - Ableton Live 12 Trial'), { set: 'Night Drive', edition: 'Live 12 Trial' });
  assert.deepEqual(parseTitle('Night Drive* [Night Drive Project] - Ableton Live 12 Suite'), { set: 'Night Drive', edition: 'Live 12 Suite' });
  assert.deepEqual(parseTitle('Untitled - Ableton Live 12 Trial'), { set: '', edition: 'Live 12 Trial' });
  assert.deepEqual(parseTitle('Beat - Ableton Live 11'), { set: 'Beat', edition: 'Live 11' });
  assert.equal(parseTitle(''), null);
  assert.equal(parseTitle('Ableton Index'), null);
});

test('the card says drums only with drum gear, and never "Untitled"', () => {
  const config = validateConfig({});
  const drums = activity(100, { drums: true, set: 'Night Drive', edition: 'Live 12 Trial' }, config);
  assert.equal(drums.name, 'Ableton Live');
  assert.equal(drums.details, 'Playing drums');
  assert.equal(drums.state, 'Working on Night Drive');
  assert.equal(drums.assets.large_text, 'Live 12 Trial');
  assert.equal(drums.assets.large_image, PAD_GRID_URL);
  assert.equal(activity(100, { drums: false, set: '', edition: 'Live 12 Trial' }, config).details, 'Making music');
  assert.equal(activity(100, { drums: true, set: '' }, config).state, 'Jamming');
  assert.equal(activity(100, { drums: true, set: 'Secret' }, { ...config, showSetName: false }).state, 'Jamming');
  assert.equal(activity(null, {}, config), null);
});

test('settings default to the recommended answers and reject bad values', () => {
  assert.equal(BUILT_IN_CLIENT_ID, '1567036812768186491');
  assert.deepEqual(validateConfig({}), { clientId: BUILT_IN_CLIENT_ID, image: PAD_GRID_URL, showSetName: true, drumDevices: ['APC64'], automaticOnStart: true });
  // A settings file saved before the built-in ID existed picks it up.
  assert.equal(validateConfig({ clientId: '' }).clientId, BUILT_IN_CLIENT_ID);
  assert.throws(() => validateConfig({ clientId: '123' }), /Application ID/);
  assert.equal(validateConfig({ clientId: '1555096326734094356' }).clientId, '1555096326734094356');
  // Device names reach a PowerShell filter, so quotes and wildcards are dropped.
  assert.deepEqual(validateConfig({ drumDevices: ["APC64", "x' OR 1", 'TD-17', '%'] }).drumDevices, ['APC64', 'TD-17']);
  assert.equal(validateConfig({ image: 'https://raw.githubusercontent.com/findastra/ableton-live-discord-presence/main/public/pad-grid-card-20261102.gif?v=0' }).image, PAD_GRID_URL);
});

test('the timer starts when Ableton opens and stops when it closes or sharing is off', () => {
  const presence = new Presence();
  presence.setMode('auto');
  assert.equal(presence.update(true, 5000), 5);
  assert.equal(presence.update(true, 9000), 5);
  assert.equal(presence.update(false, 9000), null);
  presence.setMode('off');
  assert.equal(presence.update(true, 9000), null);
  // Start shares straight away, even before Ableton opens.
  presence.setMode('manual');
  assert.equal(presence.update(false, 12000), 12);
  assert.throws(() => presence.setMode('always'), /Start, Stop, or Automatic/);
});

test('the probe reads only the window title and a device count', async () => {
  assert.match(probeScript(['APC64']), /Name LIKE '%APC64%'/);
  assert.doesNotMatch(probeScript(["bad'name"]), /bad/);
  assert.deepEqual(readProbe('{"title":"Untitled - Ableton Live 12 Trial","drums":10}'),
    { active: true, drums: true, set: '', edition: 'Live 12 Trial', message: 'Ableton Live 12 Trial is open and your drums are plugged in.' });
  assert.equal(readProbe('{"title":"","drums":3}').active, false);
  assert.equal(readProbe('not json').active, false);
  const result = await detectAbleton({ devices: ['APC64'], runner: async () => '{"title":"Song - Ableton Live 12 Trial","drums":0}' });
  assert.deepEqual([result.active, result.drums, result.set], [true, false, 'Song']);
  assert.equal((await detectAbleton({ runner: async () => { throw new Error('x'); } })).active, false);
});

test('the Windows startup file points at this copy and can be removed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ableton-presence-'));
  const opts = { io: fs, appRoot: join(dir, 'app'), platform: 'win32', appdata: join(dir, 'appdata'), execPath: 'C:\\node\\node.exe' };
  const config = setStartup(true, opts);
  assert.equal(config.automaticOnStart, true);
  const vbs = join(dir, 'appdata', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', LAUNCHER_NAME);
  assert.match(readFileSync(vbs, 'utf8'), /launch-20261102\.js"" --background/);
  assert.equal(startupEnabled(opts), true);
  setStartup(false, opts);
  assert.equal(existsSync(vbs), false);
  assert.equal(JSON.parse(readFileSync(join(dir, 'app', '.local', 'config.json'), 'utf8')).automaticOnStart, false);
});

// A plain GIF decoder, so the test checks the bytes rather than trusting the encoder.
function decodeFrames(gif) {
  let p = 6;
  const width = gif.readUInt16LE(p), height = gif.readUInt16LE(p + 2), flags = gif[p + 4];
  p += 7;
  if (flags & 0x80) p += 3 * (1 << ((flags & 7) + 1));
  const frames = [];
  while (gif[p] !== 0x3b) {
    if (gif[p] === 0x21) { p += 2; while (gif[p]) p += gif[p] + 1; p++; continue; }
    assert.equal(gif[p], 0x2c);
    p += 10;
    const min = gif[p++];
    const data = [];
    while (gif[p]) { data.push(...gif.subarray(p + 1, p + 1 + gif[p])); p += gif[p] + 1; }
    p++;
    const clear = 1 << min, end = clear + 1, out = [];
    let size = min + 1, dict = [], prev = null, bit = 0;
    const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; dict[clear] = []; dict[end] = []; size = min + 1; prev = null; };
    reset();
    for (;;) {
      let code = 0;
      for (let i = 0; i < size; i++, bit++) code |= ((data[bit >> 3] >> (bit & 7)) & 1) << i;
      if (code === clear) { reset(); continue; }
      if (code === end) break;
      const entry = code < dict.length ? dict[code] : [...prev, prev[0]];
      out.push(...entry);
      if (prev) dict.push([...prev, entry[0]]);
      prev = entry;
      if (dict.length === 1 << size && size < 12) size++;
    }
    assert.equal(out.length, width * height);
    frames.push(Uint8Array.from(out));
  }
  return frames;
}

test('the GIF encoder round-trips, including a full 4096-code dictionary', () => {
  const palette = Array.from({ length: 256 }, (_, i) => [i, i, i]);
  let seed = 1;
  const noise = Uint8Array.from({ length: 200 * 200 }, () => (seed = (seed * 1103515245 + 12345) % 2147483648) % 256);
  assert.deepEqual(decodeFrames(encodeGif(200, 200, palette, [noise], 10)), [noise]);
});

test('the card picture plays every design once, stays under 10 MB and matches the shipped file', () => {
  const gif = makeCardGif();
  // GitHub serves larger raw files without an image type, and Discord then shows no picture.
  assert.ok(gif.length < 10 * 1024 * 1024);
  const frames = decodeFrames(gif);
  assert.equal(frames.length, SCENES.length * SCENE_STEPS * 2);
  assert.equal(frames[0].length, CARD_SIZE * CARD_SIZE);
  assert.deepEqual(readFileSync(new URL('../public/pad-grid-card-20261102.gif', import.meta.url)), gif);
});

test('the app icon is the card\'s first frame, drawn at 1024, and matches the shipped file', () => {
  assert.deepEqual(readFileSync(new URL('../public/pad-grid-icon-20261102.png', import.meta.url)), makeIconPng());
  // The card's first frame is the same drawing as the icon, at the card's size.
  assert.deepEqual(cardFrames()[0], drawPads(new Uint8ClampedArray(CARD_SIZE * CARD_SIZE * 4), CARD_SIZE, 0, CARD_FILL));
  // Drum hits flash to full brightness on their step.
  assert.equal(SCENES[0].name, 'rainbow swirl');
  assert.equal(lights(SCENE_STEPS)[7][0], 1);
  assert.ok(lights(SCENE_STEPS + 0.5)[7][0] < 1);
});
