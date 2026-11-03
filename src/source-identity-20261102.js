import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Which copy of the app is running: its real folder and a hash of its source, so the launcher can tell
// an older copy from this one.
export function sourceIdentity(root = fileURLToPath(new URL('../', import.meta.url))) {
  const canonical = realpathSync(root).replaceAll('\\', '/');
  const files = [
    ...readdirSync(join(root, 'src')).filter(name => name.endsWith('.js')).map(name => 'src/' + name),
    ...readdirSync(join(root, 'public')).filter(name => /\.(?:html|js|css)$/.test(name)).map(name => 'public/' + name),
    'package.json',
  ].sort();
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0');
  return Object.freeze({ installationPath: process.platform === 'win32' ? canonical.toLowerCase() : canonical, buildId: hash.digest('hex') });
}
// Captured once: a running server continues to identify the code it loaded even after files change.
export const SOURCE_IDENTITY = sourceIdentity();
