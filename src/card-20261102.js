// What the Discord card says, and the settings that shape it.

// The project's own Discord application. Application IDs are
// public, so friends can use it without any setup. Registered as "Ableton Live Presence" (Astra, 2026-11-02).
export const BUILT_IN_CLIENT_ID = '1567036812768186491';

// Card art: loaded by Discord straight from the public repo, so nobody has to upload it in the Developer Portal.
// Bump ?v= whenever the card art changes so Discord fetches the new image instead of a cached one.
export const PAD_GRID_URL = 'https://raw.githubusercontent.com/findastra/ableton-live-discord-presence/main/public/pad-grid-card-20261102.gif?v=3';

// Drum gear found by its Windows device name. The APC64 is Astra's pad controller.
export const DEFAULT_DRUM_DEVICES = ['APC64'];

export function clean(value, max = 110) {
  return String(value ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Ableton's window title: "Night Drive - Ableton Live 12 Trial", "Night Drive* [Night Drive Project] - Ableton Live 12 Suite".
// A star marks unsaved changes; the brackets name the project folder. Both are left off the card.
export function parseTitle(title) {
  const match = /^(.*?)\*?(?: \[[^\]]*\])? - Ableton (Live \d+(?: [A-Za-z]+)?)$/.exec(clean(title, 300));
  if (!match) return null;
  const set = clean(match[1]);
  return { set: /^untitled$/i.test(set) ? '' : set, edition: match[2] };
}

export class Presence {
  mode = 'off';
  startedAt = null;
  setMode(mode) {
    if (!['off', 'auto', 'manual'].includes(mode)) throw new Error('Choose Start, Stop, or Automatic.');
    if (mode !== this.mode) this.startedAt = null;
    this.mode = mode;
  }
  // Start (manual) shares straight away; Automatic shares while Ableton Live is open.
  update(active, now = Date.now()) {
    if (!(this.mode === 'manual' || (this.mode === 'auto' && active))) this.startedAt = null;
    else this.startedAt ??= Math.floor(now / 1000);
    return this.startedAt;
  }
}

export function activity(startedAt, detection = {}, config = {}) {
  if (startedAt === null) return null;
  const set = config.showSetName === true ? clean(detection.set) : '';
  return {
    type: 0,
    // Card title. Discord shows this instead of the registered app name, which can't be a brand name.
    name: 'Ableton Live',
    details: detection.drums ? 'Playing drums' : 'Making music',
    state: set ? `Working on ${set}` : 'Jamming',
    timestamps: { start: startedAt },
    assets: { large_image: config.image || PAD_GRID_URL, large_text: clean(detection.edition, 64) || 'Ableton Live' },
  };
}

export function validateConfig(input = {}) {
  const clientId = String(input.clientId || BUILT_IN_CLIENT_ID).trim();
  const savedImage = String(input.image || PAD_GRID_URL).trim();
  // Refresh only this app's built-in art; keep custom image URLs and asset keys.
  const image = /^https:\/\/raw\.githubusercontent\.com\/findastra\/ableton-live-discord-presence\/main\/public\/pad-grid-card-\d{8}\.gif(?:\?v=\d+)?$/.test(savedImage) ? PAD_GRID_URL : savedImage;
  if (clientId && !/^\d{17,20}$/.test(clientId)) throw new Error('Paste the 17–20 digit Discord Application ID. No token needed.');
  if (!/^[a-z0-9_-]{1,128}$/.test(image) && !/^https:\/\/[^\s"<>]{1,240}$/.test(image)) throw new Error('Use an uploaded asset key or an https image link.');
  const devices = Array.isArray(input.drumDevices) ? input.drumDevices : DEFAULT_DRUM_DEVICES;
  const drumDevices = [...new Set(devices.map(name => clean(name, 40)).filter(name => /^[\w .()+-]{2,40}$/.test(name)))].slice(0, 8);
  return { clientId, image, showSetName: input.showSetName !== false, drumDevices,
    automaticOnStart: input.automaticOnStart !== false };
}
