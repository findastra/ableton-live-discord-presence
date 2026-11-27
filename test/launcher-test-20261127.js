import test from 'node:test';
import assert from 'node:assert/strict';
import { launch } from '../src/launch-20261102.js';

test('helper Automatic option enables the verified running Ableton presence', async () => {
  const calls = [];
  const identity = { installationPath: 'test', buildId: 'test' };
  await launch({ identity, background: true, automatic: true,
    spawnProcess: () => { throw new Error('Already running; should not spawn.'); },
    fetcher: async (url, options) => {
      if (options.method === 'POST') { calls.push({ url, options }); return { ok: true }; }
      return { ok: true, json: async () => ({ app: 'ableton-live-discord-presence', identity }) };
    } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://127.0.0.1:38765/api/mode');
  assert.deepEqual(JSON.parse(calls[0].options.body), { mode: 'auto' });
  assert.equal(calls[0].options.headers.Origin, 'http://127.0.0.1:38765');
});
