import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SavedMode, DisplayLease } from '../src/presence-runtime-20261127.js';
test('mode survives restart, including explicit Stop over automatic startup', t => {
  const dir = mkdtempSync(join(tmpdir(), 'presence-mode-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = new SavedMode(dir);
  assert.equal(store.read('auto'), 'auto');
  for (const mode of ['auto', 'manual', 'off']) {
    store.save(mode);
    assert.equal(new SavedMode(dir).read('auto'), mode);
  }
  assert.throws(() => store.save('invalid'));
  assert.equal(store.read('auto'), 'off');
  writeFileSync(store.path, '{broken');
  assert.equal(store.read('auto'), 'off');
});
test('display lease expires and never changes saved mode', () => {
  const lease = new DisplayLease();
  assert.equal(lease.allows(1000), true);
  lease.update({ selected: false, until: 9000 }, 1000);
  assert.equal(lease.allows(5000), false);
  assert.equal(lease.allows(9001), true);
  assert.throws(() => lease.update({ selected: true, until: 999999 }, 1000));
});

test('countdown mode validation cannot persist an unsupported mode', t => {
  const dir = mkdtempSync(join(tmpdir(), 'countdown-mode-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = new SavedMode(dir, ['off', 'manual']);
  store.save('manual');
  assert.throws(() => store.save('auto'));
  assert.equal(store.read(), 'manual');
  writeFileSync(store.path, JSON.stringify({ mode: 'auto' }));
  assert.equal(store.read(), 'off');
});

test('idle rotation includes enabled modes, never Off, and expires safely', () => {
  const lease = new DisplayLease();
  lease.update({ selected: true, includeIdle: true, until: 9000 }, 1000);
  assert.equal(lease.keepsEnabled('auto', 5000), true);
  assert.equal(lease.keepsEnabled('manual', 5000), true);
  assert.equal(lease.keepsEnabled('off', 5000), false);
  assert.equal(lease.keepsEnabled('auto', 9000), false);
  lease.update({ selected: true, includeIdle: false, until: 10000 }, 5000);
  assert.equal(lease.keepsEnabled('auto', 6000), false);
});
