const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const user = process.env.NEWS_USER || 'studio';
const password = process.env.NEWS_PASSWORD || 'studio';
const file = process.env.NEWS_FILE || '/data/news.json';
const maxBodySize = 20000;

function emptyEntry() {
  return { title: '', text: '', link: '', button: '' };
}

function emptyState() {
  return { enabled: false, de: emptyEntry(), en: emptyEntry() };
}

fs.mkdirSync(path.dirname(file), { recursive: true });
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, `${JSON.stringify(emptyState(), null, 2)}\n`);
}

function authorized(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString();
  const split = decoded.indexOf(':');
  return split > 0 && decoded.slice(0, split) === user && decoded.slice(split + 1) === password;
}

function requireAuthorization(req, res) {
  if (authorized(req)) return true;
  res.setHeader('WWW-Authenticate', 'Basic realm="Studio news"');
  send(res, 401, { error: 'Authentication required' });
  return false;
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body));
}

function normalizeEntry(value, allowEmpty = true) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.title !== 'string' || typeof value.text !== 'string' || typeof value.link !== 'string' || typeof value.button !== 'string') return null;

  const entry = {
    title: value.title.trim(),
    text: value.text.trim(),
    link: value.link.trim(),
    button: value.button.trim()
  };

  if (entry.title.length > 120 || entry.text.length > 800 || entry.link.length > 2048 || entry.button.length > 40) return null;
  if ((!entry.title && entry.text) || (entry.title && !entry.text)) return null;
  if (!entry.title && (entry.link || entry.button)) return null;
  if ((!entry.link && entry.button) || (entry.link && !entry.button)) return null;
  if (!allowEmpty && (!entry.title || !entry.text)) return null;

  if (entry.link) {
    try {
      const url = new URL(entry.link);
      if (url.protocol !== 'https:' || !url.hostname) return null;
    } catch {
      return null;
    }
  }

  return entry;
}

function normalizeState(value, requireGerman = false) {
  if (!value || typeof value !== 'object' || typeof value.enabled !== 'boolean') return null;
  const de = normalizeEntry(value.de, !requireGerman);
  const en = normalizeEntry(value.en, true);
  if (!de || !en) return null;
  return { enabled: value.enabled, de, en };
}

function normalizeLegacyEntry(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.title !== 'string' || typeof value.text !== 'string' || typeof value.link !== 'string' || typeof value.button !== 'string') return null;

  const entry = {
    title: value.title.trim(),
    text: value.text.trim(),
    link: value.link.trim(),
    button: value.button.trim().slice(0, 40)
  };

  if (entry.title.length > 120 || entry.text.length > 800) return null;
  if (!entry.title || !entry.text) return emptyEntry();

  // The old form allowed either field to be omitted. In that case the button
  // was not displayed, so preserve that behaviour while migrating the data.
  if (!entry.link || !entry.button || entry.link.length > 2048) {
    entry.link = '';
    entry.button = '';
    return entry;
  }

  try {
    const url = new URL(entry.link);
    if (url.protocol !== 'https:' || !url.hostname) {
      entry.link = '';
      entry.button = '';
    }
  } catch {
    entry.link = '';
    entry.button = '';
  }

  return entry;
}

function readState() {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));

  // Read the original flat format so existing production data keeps working.
  if (!Object.prototype.hasOwnProperty.call(value, 'de')) {
    const de = normalizeLegacyEntry(value);
    if (!de) throw new Error('Invalid legacy news data');
    return { enabled: Boolean(de.title && de.text), de, en: emptyEntry() };
  }

  const state = normalizeState(value);
  if (!state) throw new Error('Invalid news data');
  return state;
}

function writeState(state) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(temp, file);
}

function readJsonBody(req, res, callback) {
  let body = '';
  let size = 0;
  let tooLarge = false;

  req.on('data', chunk => {
    size += chunk.length;
    if (size > maxBodySize) {
      tooLarge = true;
      return;
    }
    body += chunk;
  });

  req.on('end', () => {
    if (tooLarge) return send(res, 413, { error: 'Request too large' });
    try {
      callback(JSON.parse(body));
    } catch {
      send(res, 400, { error: 'Invalid JSON' });
    }
  });

  req.on('error', () => {
    if (!res.headersSent) send(res, 400, { error: 'Invalid request' });
  });
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return send(res, 400, { error: 'Invalid request URL' });
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/news') {
    try {
      const state = readState();
      const language = url.searchParams.get('lang') === 'en' ? 'en' : 'de';
      return send(res, 200, state.enabled ? state[language] : emptyEntry());
    } catch (error) {
      console.error('Unable to read news:', error.message);
      return send(res, 500, { error: 'Unable to read news' });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/news') {
    if (!requireAuthorization(req, res)) return;
    try {
      return send(res, 200, readState());
    } catch (error) {
      console.error('Unable to read news:', error.message);
      return send(res, 500, { error: 'Unable to read news' });
    }
  }

  if (req.method === 'DELETE' && url.pathname === '/api/news') {
    if (!requireAuthorization(req, res)) return;
    try {
      const state = readState();
      state.enabled = false;
      writeState(state);
      return send(res, 200, state);
    } catch (error) {
      console.error('Unable to disable news:', error.message);
      return send(res, 500, { error: 'Unable to disable news' });
    }
  }

  if (req.method === 'PUT' && url.pathname === '/api/news') {
    if (!requireAuthorization(req, res)) return;
    return readJsonBody(req, res, value => {
      const state = normalizeState({ ...value, enabled: true }, true);
      if (!state) return send(res, 400, { error: 'Invalid news data' });
      try {
        writeState(state);
        return send(res, 200, state);
      } catch (error) {
        console.error('Unable to save news:', error.message);
        return send(res, 500, { error: 'Unable to save news' });
      }
    });
  }

  return send(res, 404, { error: 'Not found' });
});

server.listen(port, '0.0.0.0');
