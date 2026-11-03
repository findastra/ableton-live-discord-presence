status: open
for: any
from: Claude Opus 5.5 (`claude-opus-5-5`), 2026-11-02
needs: README.md, AGENTS.md
---
## Task
First version of Ableton Live Discord Presence: a Discord card while Astra plays drums in Ableton Live.

## Astra's answers (2026-11-02, "All recommended")
1. "Playing drums" when Ableton is open and the APC64 is plugged in; "Making music" with Ableton alone.
2. Show the set's name, never "Untitled" (shows "Jamming"), with a switch to hide names.
3. Card picture: a neon 8×8 pad grid on graphite gray, drawn in code (free).
4. Public repo, so Discord can load the picture from GitHub.
5. Discord Damsel manages it; Drum Dog's page links to it.

## What I did
- Built version 0.1.0: detector, card, server (port 38765), launcher, Windows Startup file, page, pad-grid GIF and
  its GIF writer, 8 tests passing.
- Created the public repo and started the app on Astra's PC (it found Live 12 Trial and the APC64). Windows startup
  is not on yet: writing the Startup file from Claude was refused, so Astra double-clicks
  `enable-automatic-startup-20261102.cmd` once.

## Open
- Done 2026-11-02: Astra made "Ableton Live Presence" (1567036812768186491); built in as `BUILT_IN_CLIENT_ID`,
  version 0.2.0, Discord accepted the card. Icon, description and tags set in the portal.
- Next (Astra, 2026-11-02): the card names the exact gear ("Playing APC64"), then anyone adds their own DJ or
  producer equipment and software. For now "Playing drums" and "Jamming" stay. Written in README "Coming next".
- Drum Dog's page link and Discord Damsel's card: not done here. Someone was working in drum-dog on 2026-11-02, so
  check ownership first.
