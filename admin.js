const loginForm = document.querySelector('#login-form');
const newsForm = document.querySelector('#news-form');
const status = document.querySelector('#status');
const publishButton = document.querySelector('#publish-news');
const disableButton = document.querySelector('#disable-news');
let auth = '';
let newsEnabled = false;

function showStatus(text) {
  status.textContent = text;
}

function encodeBasicAuth(username, password) {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `Basic ${btoa(binary)}`;
}

async function request(path, options = {}) {
  const headers = { Authorization: auth, ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';
  return fetch(path, { cache: 'no-store', ...options, headers });
}

async function errorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

function setBusy(busy) {
  publishButton.disabled = busy;
  disableButton.disabled = busy || !newsEnabled;
}

function setEntry(prefix, entry = {}) {
  for (const field of ['title', 'text', 'link', 'button']) {
    newsForm.elements[`${prefix}-${field}`].value = entry[field] || '';
  }
}

function getEntry(prefix) {
  return Object.fromEntries(['title', 'text', 'link', 'button'].map(field => [
    field,
    newsForm.elements[`${prefix}-${field}`].value.trim()
  ]));
}

function validateEntry(entry, label, required) {
  if (required && (!entry.title || !entry.text)) return `${label}: Überschrift und Text sind erforderlich.`;
  if ((!entry.title && entry.text) || (entry.title && !entry.text)) return `${label}: Überschrift und Text müssen gemeinsam ausgefüllt werden.`;
  if ((!entry.link && entry.button) || (entry.link && !entry.button)) return `${label}: Link und Button-Beschriftung müssen gemeinsam ausgefüllt werden.`;
  return '';
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(loginForm);
  auth = encodeBasicAuth(data.get('user'), data.get('password'));
  showStatus('Anmeldung wird geprüft …');

  try {
    const response = await request('/api/admin/news');
    if (!response.ok) {
      auth = '';
      showStatus(response.status === 401 ? 'Anmeldung fehlgeschlagen.' : await errorMessage(response, 'Anmeldung derzeit nicht möglich.'));
      return;
    }

    const news = await response.json();
    setEntry('de', news.de);
    setEntry('en', news.en);
    loginForm.hidden = true;
    newsForm.hidden = false;
    newsEnabled = news.enabled;
    setBusy(false);
    showStatus(news.enabled ? 'Angemeldet. Die Meldung ist derzeit sichtbar.' : 'Angemeldet. Derzeit ist keine Meldung sichtbar.');
  } catch {
    auth = '';
    showStatus('Der Server ist derzeit nicht erreichbar.');
  }
});

newsForm.addEventListener('submit', async event => {
  event.preventDefault();
  const de = getEntry('de');
  const en = getEntry('en');
  const validationError = validateEntry(de, 'Deutsch', true) || validateEntry(en, 'Englisch', false);
  if (validationError) {
    showStatus(validationError);
    return;
  }

  setBusy(true);
  showStatus('Meldung wird veröffentlicht …');
  try {
    const response = await request('/api/news', { method: 'PUT', body: JSON.stringify({ de, en }) });
    if (!response.ok) {
      showStatus(await errorMessage(response, 'Speichern fehlgeschlagen.'));
      return;
    }
    newsEnabled = true;
    showStatus('Meldung veröffentlicht.');
  } catch {
    showStatus('Speichern fehlgeschlagen: Der Server ist nicht erreichbar.');
  } finally {
    setBusy(false);
  }
});

disableButton.addEventListener('click', async () => {
  setBusy(true);
  showStatus('Meldung wird ausgeblendet …');
  try {
    const response = await request('/api/news', { method: 'DELETE' });
    if (!response.ok) {
      showStatus(await errorMessage(response, 'Ausblenden fehlgeschlagen.'));
      return;
    }
    newsEnabled = false;
    showStatus('Meldung ausgeblendet. Die eingegebenen Inhalte bleiben gespeichert.');
  } catch {
    showStatus('Ausblenden fehlgeschlagen: Der Server ist nicht erreichbar.');
  } finally {
    setBusy(false);
  }
});
