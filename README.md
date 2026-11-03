# Ableton Live Discord Presence

*By Astra.* Let your Discord friends see when you're playing drums in Ableton Live. One small Windows app.

## The Card

<img src="public/pad-grid-card-20261102.gif" alt="The card picture: an 8×8 grid of neon pads on graphite gray, lighting up in a drum pattern" width="160" align="left">

**Ableton Live**<br>
Playing drums<br>
Working on Night Drive<br>
01:23 elapsed

<br clear="left">

- **Playing drums** while Ableton Live is open and your drum gear (an APC64 by default) is plugged in.
  **Making music** when only Ableton is open.
- **Working on …** shows the open set's name. An unsaved set ("Untitled") shows **Jamming**, and you can turn names off.
- Hover the picture to see your Live version, such as Live 12 Trial.
- The card appears a few seconds after Ableton opens and disappears when Ableton closes.

## Install

1. Install [Node.js 24 or later](https://nodejs.org/en/download). No `npm install` is needed.
2. Download this repo (Code › Download ZIP) and unzip it somewhere it can stay.
3. Double-click `start-ableton-live-discord-presence-20261102.cmd`. Its page opens at <http://127.0.0.1:38763/>.
4. Paste the Discord Application ID (once, until a built-in one ships), tick
   *Start quietly when Windows starts*, and click **Save**.

Discord desktop must be running. In Discord, User Settings › Activity Privacy › *Share your detected activities with
others* must be on for friends to see the card.

## Your own Discord application

Every presence card belongs to a Discord application. Make one at
<https://discord.com/developers/applications> (New Application). Discord refuses brand names like "Ableton Live",
so call it something like "Drum Session". The card still says **Ableton Live** at the top. Copy the
**Application ID** from General Information. It is public: no token or secret is needed.

## Privacy

The app reads only Ableton Live's window title (for the set name and Live version) and whether a Windows device
with your drum gear's name is plugged in. It never reads audio, MIDI notes, set files or anything inside Ableton,
and it does not open the APC64, so Ableton keeps it to itself. Nothing leaves your PC except the card you send to
Discord. Settings stay in `.local/config.json` in the app folder.

## Files

| Path | What it does |
| --- | --- |
| `src/card-20261102.js` | What the card says, and the settings |
| `src/detector-20261102.js` | Finds Ableton's window and the drum gear |
| `src/rpc-20261102.js` | Talks to Discord desktop over its local pipe |
| `src/server-20261102.js` | The app: the control page at port 38763 and the card updates |
| `src/launch-20261102.js` | Starts the app once, or opens the page if it's already running |
| `src/windows-startup-20261102.js` | Writes or removes `ableton-live-discord-presence-20261102.vbs` in the Startup folder |
| `scripts/make-pad-grid-20261102.js` | Draws the card picture (`npm run art`), original art made in code |
| `test/app-test-20261102.js` | `node --test` |

## Limits

- Windows and Discord desktop only (not the browser version of Discord).
- "Playing drums" means your drum gear is plugged in while Ableton is open, not that you are hitting pads that very
  second. Reading pad hits would mean opening the APC64, which Windows usually lets only one program do.
- Version 0.1.0 has no built-in Application ID yet, so you paste one the first time.

## License

[MIT](LICENSE).
