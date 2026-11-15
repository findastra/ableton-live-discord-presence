// Builds the friend download in downloads/: one ZIP unzipping into its own folder, as AI Discord Presence's do.
// Standard uncompressed ZIP, written by hand: no dependencies, only an allowlist of files.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
mkdirSync(join(root, 'downloads'), { recursive: true });

const apps = [['ableton-live-discord-presence', 'Ableton Live Discord Presence']];
for (const [app, title] of apps) {
  const dir = root, name = app;
  const files = [
    ...['LICENSE', 'README.md', 'package.json', `Start ${title}.cmd`, 'Enable Automatic Startup.cmd', 'scripts/startup-20261102.js',
        ...readdirSync(join(dir, 'src')).filter(f => f.endsWith('.js')).map(f => `src/${f}`),
        ...readdirSync(join(dir, 'public')).map(f => `public/${f}`)].map(f => [join(dir, f), f]),
  ];
  const entries = [], central = []; let offset = 0;
  for (const [path, file] of files) {
    const data = readFileSync(path), entryName = Buffer.from(`${name}/${file}`), crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(33, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(entryName.length, 26);
    entries.push(local, entryName, data);
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50); head.writeUInt16LE(20, 4); head.writeUInt16LE(20, 6); head.writeUInt16LE(0x800, 8);
    head.writeUInt16LE(33, 14); head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(data.length, 20); head.writeUInt32LE(data.length, 24); head.writeUInt16LE(entryName.length, 28); head.writeUInt32LE(offset, 42);
    central.push(head, entryName); offset += local.length + entryName.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  const zip = Buffer.concat([...entries, directory, end]);
  writeFileSync(join(root, 'downloads', `${name}.zip`), zip);
  console.log(`downloads/${name}.zip: ${files.length} files, ${(zip.length / 1048576).toFixed(1)} MB`);
}
