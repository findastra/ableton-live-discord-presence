const $ = id => document.getElementById(id);
const hosted = document.body.hasAttribute('data-hosted') || location.protocol === 'file:';
let state;
let ended = false;
$('topic').addEventListener('click', async () => {
  if (hosted) {
    const on = $('topic').getAttribute('aria-pressed') !== 'true';
    $('topic').setAttribute('aria-pressed', String(on));
    $('topic').textContent = on ? 'Hide Song Name' : 'Show Song Name';
    $('project-preview').textContent = on ? 'Working on Night Drive' : 'Jamming';
    return;
  }
  if (!state) return;
  $('topic').disabled = true;
  try { await request('/api/config', { ...state.config, showSetName: !state.config.showSetName }); await refresh(); }
  catch {}
  finally { $('topic').disabled = false; }
});

async function request(path, body) {
  const response = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not update the app.');
  return data;
}

function drawTimer() {
  $('timer').parentElement.classList.remove('running');
  if (ended) { $('timer').textContent = 'App closed. You can close this tab.'; return; }
  if (!state?.startedAt) { $('timer').textContent = 'Ready when you are'; return; }
  const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - state.startedAt);
  // Discord writes elapsed time as 0:17, 12:05 or 1:02:09, in green beside a controller.
  const h = Math.floor(elapsed / 3600), m = Math.floor(elapsed / 60) % 60, sec = String(elapsed % 60).padStart(2, '0');
  $('timer').textContent = h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  $('timer').parentElement.classList.add('running');
}

async function refresh() {
  if (ended || hosted) return;
  try {
    state = await request('/api/status');
    $('model-preview').textContent = state.card.details;
    $('project-preview').textContent = state.card.state;
    $('topic').textContent = state.config.showSetName ? 'Hide Song Name' : 'Show Song Name';
    $('topic').setAttribute('aria-pressed', String(state.config.showSetName === true));
    // Start, Stop and Automatic are one choice: only the current mode is lit.
    for (const mode of ['manual', 'off', 'auto']) $(mode).setAttribute('aria-pressed', String(state.mode === mode));
    drawTimer();
  } catch {
    state = null;
    drawTimer();
  }
}

for (const mode of ['manual', 'off', 'auto']) {
  $(mode).addEventListener('click', async () => {
    if (hosted) {
      for (const other of ['manual', 'off']) $(other).setAttribute('aria-pressed', String(other === mode));
      state = { startedAt: mode === 'manual' ? (state?.startedAt || Math.floor(Date.now() / 1000)) : null };
      drawTimer();
      return;
    }
    $(mode).disabled = true;
    try { await request('/api/mode', { mode }); await refresh(); }
    catch {}
    finally { $(mode).disabled = false; }
  });
}
// Quit closes the whole app, so a stray click only asks: a second click within 3 seconds quits.
let quitAsk;
$('quit').addEventListener('click', async () => {
  if (!quitAsk) {
    $('quit').textContent = 'Click again to quit';
    quitAsk = setTimeout(() => { quitAsk = null; $('quit').textContent = 'Quit'; }, 3000);
    return;
  }
  clearTimeout(quitAsk);
  try {
    await request('/api/quit', {});
    ended = true;
    state = null;
    drawTimer();
    document.querySelectorAll('button').forEach(button => { button.disabled = true; });
  } catch {}
});
if (hosted) {
  document.body.classList.add('hosted');
  $('download').hidden = false;
  $('quit').hidden = true;
  $('model-preview').textContent = 'Playing drums';
  $('project-preview').textContent = 'Working on Night Drive';
  $('topic').textContent = 'Hide Song Name';
  $('topic').setAttribute('aria-pressed', 'true');
  $('manual').setAttribute('aria-pressed', 'true');
  $('off').setAttribute('aria-pressed', 'false');
  state = { startedAt: Math.floor(Date.now() / 1000) - 42 * 60 };
  drawTimer();
} else void refresh();
setInterval(refresh, 2000);
setInterval(drawTimer, 1000);
