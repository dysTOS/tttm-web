const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const user = process.env.NEWS_USER || 'studio';
const password = process.env.NEWS_PASSWORD || 'studio';
const file = process.env.NEWS_FILE || '/data/news.json';
fs.mkdirSync(path.dirname(file), { recursive: true });
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ title: '', text: '', link: '', button: '' }, null, 2) + '\n');

function authorized(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString();
  const split = decoded.indexOf(':');
  return split > 0 && decoded.slice(0, split) === user && decoded.slice(split + 1) === password;
}
function send(res, status, body, type = 'application/json') { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(type === 'application/json' ? JSON.stringify(body) : body); }
function readNews() { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function validNews(value) {
  if (!value || typeof value.title !== 'string' || typeof value.text !== 'string') return false;
  if (value.title.length > 120 || value.text.length > 800 || typeof value.link !== 'string' || typeof value.button !== 'string') return false;
  if (value.link && !/^https:\/\//i.test(value.link)) return false;
  return value;
}
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/news') return send(res, 200, readNews());
  if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true });
  if (req.method !== 'PUT' || req.url !== '/api/news') return send(res, 404, { error: 'Not found' });
  if (!authorized(req)) { res.setHeader('WWW-Authenticate', 'Basic realm="Studio news"'); return send(res, 401, { error: 'Authentication required' }); }
  let body = ''; req.on('data', chunk => { body += chunk; if (body.length > 20000) req.destroy(); });
  req.on('end', () => { try { const news = validNews(JSON.parse(body)); if (!news) return send(res, 400, { error: 'Invalid news data' }); const temp = `${file}.tmp`; fs.writeFileSync(temp, JSON.stringify(news, null, 2) + '\n'); fs.renameSync(temp, file); send(res, 200, news); } catch { send(res, 400, { error: 'Invalid request' }); } });
});
server.listen(port, '0.0.0.0');
