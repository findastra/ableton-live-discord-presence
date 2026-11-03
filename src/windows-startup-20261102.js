import * as fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './card-20261102.js';
const root = fileURLToPath(new URL('../', import.meta.url));
export const LAUNCHER_NAME = 'ableton-live-discord-presence-20261102.vbs';
function options(value = {}) { return { io: fs, appRoot: root, platform: process.platform, appdata: process.env.APPDATA, execPath: process.execPath, ...value }; }
function target(value) {
  if (value.platform !== 'win32' || !value.appdata) throw new Error('Windows startup requires Windows.');
  return join(value.appdata, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
}
function remove(io, path) { try { io.unlinkSync(path); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
function atomicWrite(io, path, data) {
  const temporary = path + '-' + randomUUID() + '.tmp';
  io.mkdirSync(dirname(path), { recursive: true });
  let created = false;
  try {
    io.writeFileSync(temporary, data, { flag: 'wx', mode: 0o600 });
    created = true;
    io.renameSync(temporary, path);
  } finally { if (created) remove(io, temporary); }
}
export function startupEnabled(value) {
  const opts = options(value);
  try { return opts.io.readFileSync(join(target(opts), LAUNCHER_NAME), 'utf8').includes(join(opts.appRoot, 'src', 'launch-20261102.js')); } catch { return false; }
}
// Writes or removes this app's one Startup file. Settings are saved first, and put back if the Startup file fails.
export function setStartup(enabled, value) {
  if (typeof enabled !== 'boolean') throw new Error('Choose whether to run on startup.');
  const opts = options(value), { io } = opts;
  const path = join(target(opts), LAUNCHER_NAME), configPath = join(opts.appRoot, '.local', 'config.json');
  let previous;
  try { previous = io.readFileSync(configPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = validateConfig(previous === undefined ? {} : JSON.parse(previous));
  config.automaticOnStart = enabled;
  atomicWrite(io, configPath, JSON.stringify(config, null, 2) + '\n');
  try {
    if (enabled) {
      const command = '"' + opts.execPath + '" "' + join(opts.appRoot, 'src', 'launch-20261102.js') + '" --background';
      atomicWrite(io, path, 'Set shell = CreateObject("WScript.Shell")\r\nshell.Run "' + command.replaceAll('"', '""') + '", 0, False\r\n');
    } else remove(io, path);
  } catch (error) {
    if (previous === undefined) remove(io, configPath); else atomicWrite(io, configPath, previous);
    throw error;
  }
  return config;
}
