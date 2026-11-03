# Ableton Live Discord Presence

*By Astra.* Rules for AI assistants. Claude also reads [CLAUDE.md](CLAUDE.md); Codex reads this file and CLAUDE.md.

**Before any work, read in full:** this `AGENTS.md`, `CLAUDE.md`, `README.md` and `handoffs/`, then everything in the
"Before any work" list in [findastra/astras-pet-os AGENTS.md](https://github.com/findastra/astras-pet-os/blob/main/AGENTS.md).

This repo holds one Windows app that shows Ableton Live on Astra's Discord profile. It is managed by Discord Damsel
(her files live in private `findastra/discord-tower`; never add them here). Drum Dog, Astra's Ableton pet, links to it.
The AI presence apps live in `findastra/ai-discord-presence`; this app follows the same build.

- Detection reads Ableton's window title and Windows device names only. Never audio, MIDI notes, set files or the
  APC64 itself (opening it would take it away from Ableton).
- The Discord card title is "Ableton Live", sent in the activity `name` field; the registered application has a
  non-brand name.
- Card art is original, drawn by `scripts/make-pad-grid-20261102.js`. Never Ableton's or Akai's logos. When the art
  changes, rebuild it and bump `?v=` in `PAD_GRID_URL` (`src/card-20261102.js`). Generating AI images costs Astra money:
  ask first.
- Add tests with every behaviour change (`node --test`). Never commit `.local/`, credentials, caches or logs.
- New filenames use lowercase words and a date immediately before the extension. Required names (`README.md`,
  `AGENTS.md`, `CLAUDE.md`, `LICENSE`, `package.json`, `.gitignore`, `.gitattributes`) keep their exact names.

Built with:
- Version 0.1.0 (the app, its page, the pad-grid art and its GIF writer): Claude Opus 5.5 (`claude-opus-5-5`),
  2026-11-02, at Astra's request. Choices recorded in [handoffs/001](handoffs/001-any-first-version-20261102.md).
