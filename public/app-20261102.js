const $ = id => document.getElementById(id);
const form = $('settings');
let editing = false;
form.addEventListener('input', () => { editing = true; });

async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

async function refresh() {
  let status;
  try { status = await (await fetch('/api/status')).json(); }
  catch { $('message').textContent = 'The app is not running. Start it again from its folder.'; return; }
  $('message').textContent = status.message;
  const card = status.card;
  $('card-details').textContent = card.details;
  $('card-state').textContent = card.state;
  $('card-live').textContent = status.detection.active ? card.assets.large_text : 'Waiting for Ableton Live';
  for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === status.mode));
  if (!editing) {
    form.clientId.value = status.config.clientId;
    form.showSetName.checked = status.config.showSetName;
    form.drumDevices.value = status.config.drumDevices.join(', ');
    $('startup').checked = status.startupEnabled;
  }
}

for (const button of document.querySelectorAll('[data-mode]')) {
  button.addEventListener('click', async () => {
    try { await post('/api/mode', { mode: button.dataset.mode }); } catch (error) { $('message').textContent = error.message; }
    void refresh();
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await post('/api/config', { clientId: form.clientId.value.trim(), showSetName: form.showSetName.checked,
      drumDevices: form.drumDevices.value.split(',').map(name => name.trim()).filter(Boolean) });
    await post('/api/startup', { enabled: $('startup').checked });
    editing = false;
    $('message').textContent = 'Saved.';
  } catch (error) { $('message').textContent = error.message; }
  setTimeout(refresh, 600);
});

$('quit').addEventListener('click', async () => {
  try { await post('/api/quit', {}); } catch { /* Already closing. */ }
  $('message').textContent = 'The app has quit. Your card is gone from Discord.';
});

void refresh();
setInterval(refresh, 2000);
