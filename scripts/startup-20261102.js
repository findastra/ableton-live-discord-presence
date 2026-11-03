import { setStartup } from '../src/windows-startup-20261102.js';
const enabled = !process.argv.includes('--remove');
setStartup(enabled);
console.log(enabled
  ? 'Ableton Live Discord Presence will start quietly at Windows sign-in. Keep this app folder in place.'
  : 'Ableton Live Discord Presence will no longer start at Windows sign-in.');
