// Finds Ableton Live and the drum gear. Reads only Ableton's window title and Windows device names:
// never audio, MIDI notes, set files or anything inside Ableton.
import { execFile } from 'node:child_process';
import { parseTitle, clean } from './card-20261102.js';

// Device names go into a PowerShell -like filter, so only plain characters pass (validateConfig checks too).
function likeFilters(devices) {
  return devices.filter(name => /^[\w .()+-]{2,40}$/.test(name)).map(name => `Name LIKE '%${name}%'`);
}

export function probeScript(devices) {
  const filters = likeFilters(devices);
  const drums = filters.length
    ? `@(Get-CimInstance Win32_PnPEntity -Filter "(${filters.join(' OR ')}) AND Status='OK'").Count`
    : '0';
  return [
    "$p = Get-Process | Where-Object { $_.ProcessName -like 'Ableton Live*' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1",
    `$d = ${drums}`,
    '[pscustomobject]@{ title = [string]$p.MainWindowTitle; drums = $d } | ConvertTo-Json -Compress',
  ].join('; ');
}

function run(script) {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 8000, maxBuffer: 64 * 1024 },
      (error, stdout) => error ? reject(error) : resolve(stdout));
  });
}

export function readProbe(output) {
  let data;
  try { data = JSON.parse(String(output).trim() || '{}'); } catch { data = {}; }
  const live = parseTitle(clean(data.title, 300));
  if (!live) return { active: false, drums: false, set: '', edition: '', message: 'Waiting for Ableton Live to open.' };
  const drums = Number(data.drums) > 0;
  return { active: true, drums, set: live.set, edition: live.edition,
    message: drums ? `Ableton ${live.edition} is open and your drums are plugged in.` : `Ableton ${live.edition} is open. No drum gear found.` };
}

export async function detectAbleton({ devices = [], runner = run } = {}) {
  if (process.platform !== 'win32' && runner === run) return readProbe('{}');
  try { return readProbe(await runner(probeScript(devices))); }
  catch { return { active: false, drums: false, set: '', edition: '', message: 'Could not check for Ableton Live. Retrying.' }; }
}
