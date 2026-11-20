// The repo laid out like AI Discord Presence (Astra, 2026-11-15): its start files, its download and its README.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const title = 'Ableton Live Discord Presence';

test('the start files are named as in AI Discord Presence, and the dated ones are gone', () => {
  assert.match(read(`Start ${title}.cmd`), /src\\launch-20261102\.js/);
  assert.match(read(`Start ${title}.cmd`), /scripts\\startup-20261102\.js/);
  assert.match(read('Enable Automatic Startup.cmd'), new RegExp(`Start ${title}\\.cmd" --install-startup`));
  assert.equal(existsSync(new URL('../start-ableton-live-discord-presence-20261102.cmd', import.meta.url)), false);
});

test('the download is built from an allowlist and the page and README point at it', () => {
  const zip = 'https://github.com/findastra/ableton-live-discord-presence/raw/main/downloads/ableton-live-discord-presence.zip';
  assert.match(read('scripts/package-20261115.mjs'), /'ableton-live-discord-presence'/);
  assert.ok(read('public/index-20261102.html').includes(zip));
  assert.ok(read('README.md').includes(zip));
  assert.ok(readFileSync(new URL('../downloads/ableton-live-discord-presence.zip', import.meta.url)).subarray(0, 4).equals(Buffer.from('PK\x03\x04', 'latin1')));
});

test('the README has AI Discord Presence\'s sections and a picture for every button on the page', () => {
  const readme = read('README.md');
  assert.match(readme, new RegExp(`^# ${title}\\n\\n\\*By Astra\\.\\*`));
  for (const heading of ['## The Card', '## Official Artwork', '## The App', '### Buttons & Instructions', '## Quirks', '## Developer Notes', '## Credits', '## License'])
    assert.ok(readme.includes(heading + '\n'), heading);
  const buttons = [...read('public/index-20261102.html').match(/<div class="buttons">([\s\S]*?)<\/div>/)[1].matchAll(/>([^<]+)<\/button>/g)].map(m => m[1]);
  assert.deepEqual(buttons, ['Start', 'Stop', 'Automatic', 'Show Song Name', 'Quit']);
  for (const name of ['start', 'stop', 'automatic', 'song-name', 'quit']) {
    assert.ok(readme.includes(`docs/images/button-${name}-20261115.png`), name);
    assert.ok(existsSync(new URL(`../docs/images/button-${name}-20261115.png`, import.meta.url)), name);
  }
  assert.match(readme, /trademarks of their owners/);
});
