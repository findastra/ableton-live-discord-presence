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
- Built version 0.1.0: detector, card, server (port 38763), launcher, Windows Startup file, page, pad-grid GIF and
  its GIF writer, 8 tests passing.
- Created the public repo and started the app on Astra's PC (it found Live 12 Trial and the APC64). Windows startup
  is not on yet: writing the Startup file from Claude was refused, so Astra ticks it on the app's page.

## Open
- Astra makes the Discord application (a non-brand name such as "Drum Session") and gives its Application ID. Then
  set `BUILT_IN_CLIENT_ID` in `src/card-20261102.js`, bump the version and check the card appears.
- Drum Dog's page link and Discord Damsel's card: not done here. Someone was working in drum-dog on 2026-11-02, so
  check ownership first.
