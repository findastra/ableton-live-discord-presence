import { spawn } from 'node:child_process';
// By Astra. Saved sharing mode and short-lived display coordination; no UI settings change.
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
const modes = ['off', 'auto', 'manual'];
export class SavedMode {
  constructor(directory, allowedModes = modes) { this.modes = allowedModes; this.directory = directory; this.path = join(directory, 'sharing-mode-20261127.json'); }
  read(fallback = 'off') {
    try {
      const mode = JSON.parse(readFileSync(this.path, 'utf8')).mode;
      return this.modes.includes(mode) ? mode : 'off';
    } catch (error) { return error.code === 'ENOENT' ? fallback : 'off'; }
  }
  save(mode) {
    if (!this.modes.includes(mode)) throw new Error('Choose Off, Automatic, or Manual.');
    mkdirSync(this.directory, { recursive: true });
    const temporary = this.path + '.tmp';
    writeFileSync(temporary, JSON.stringify({ mode }) + '\n', { mode: 0o600 });
    renameSync(temporary, this.path);
  }
}
export class DisplayLease {
  selected = true;
  includeIdle = false;
  until = 0;
  update(value, now = Date.now()) {
    if (typeof value.selected !== 'boolean' || !Number.isSafeInteger(value.until)
      || value.until <= now || value.until > now + 15000) throw new Error('Invalid display lease.');
    this.selected = value.selected; this.until = value.until; this.includeIdle = value.includeIdle === true;
  }
  keepsEnabled(mode, now = Date.now()) { return mode !== 'off' && this.includeIdle && now < this.until; }
  allows(now = Date.now()) { return now >= this.until || this.selected; }
}

// Optional sibling installation. Downloaded standalone apps still work without Discord Tower.
export function startCoordinator(helper) {
  if (!existsSync(helper)) return;
  const child = spawn(process.execPath, [helper, '--background'],
    { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', () => {});
  child.unref();
}
