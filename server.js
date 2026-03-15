#!/usr/bin/env node
// Feature Tracker — local git-sync server
// Run with: node server.js
// Then open: http://localhost:3456

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3456;
const DIR = __dirname;
const INDEX = path.join(DIR, 'index.html');

// ── static mime types ──────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── helpers ────────────────────────────────────────────────────────────────
function sendJSON(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) });
  res.end(data);
}

function gitExec(cmd) {
  return execSync(cmd, { cwd: DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

// ── /sync POST handler ─────────────────────────────────────────────────────
function handleSync(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { state } = JSON.parse(body);
      if (!state || typeof state !== 'object') {
        return sendJSON(res, 400, { ok: false, error: 'Missing state object' });
      }

      // Read current index.html
      let html = fs.readFileSync(INDEX, 'utf8');

      // Remove existing seed tag if present
      html = html.replace(/<script id="fh-seed" type="application\/json">[\s\S]*?<\/script>\n?/, '');

      // Inject seed tag just before the init script so loadFromSeed() can
      // find the element when it runs. Fallback to </body> if not found.
      // Sanitize: re-parse and re-serialize to escape any control characters
      const cleanState = JSON.parse(JSON.stringify(state));
      const seedTag = `<script id="fh-seed" type="application/json">\n${JSON.stringify(cleanState, null, 2)}\n</script>\n`;
      const initScriptMarker = '<script>loadFromSeed()';
      if (html.includes(initScriptMarker)) {
        html = html.replace(initScriptMarker, seedTag + initScriptMarker);
      } else {
        html = html.replace('</body>', seedTag + '</body>');
      }

      fs.writeFileSync(INDEX, html, 'utf8');

      // Git commit + push
      gitExec('git add index.html');

      // Check if there's actually something to commit
      const diff = gitExec('git diff --cached --stat');
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      let committed = false;
      let pushed = false;

      if (diff) {
        const msg = `chore: auto-sync state ${now}`;
        gitExec(`git commit -m "${msg}"`);
        committed = true;
        try {
          gitExec('git push');
          pushed = true;
        } catch (e) {
          // push is best-effort — remote may not be configured
          console.warn('git push skipped:', e.message.split('\n')[0]);
        }
      } else {
        console.log('[git-sync] No changes to commit — state unchanged.');
      }

      sendJSON(res, 200, { ok: true, committed, pushed, timestamp: now });
    } catch (err) {
      console.error('Sync error:', err.message);
      sendJSON(res, 500, { ok: false, error: err.message });
    }
  });
}


// ── /api/check-update GET handler ─────────────────────────────────────────
function handleCheckUpdate(req, res) {
  try {
    gitExec('git fetch --quiet');
    const local  = gitExec('git rev-parse HEAD');
    const remote = gitExec('git rev-parse @{u}');
    sendJSON(res, 200, { hasUpdate: local !== remote });
  } catch (e) {
    // No remote, no internet, or no upstream — silently report no update
    sendJSON(res, 200, { hasUpdate: false });
  }
}

// ── HTTP server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS for same-machine requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.method === 'POST' && req.url === '/sync') return handleSync(req, res);
  if (req.method === 'GET' && req.url === '/api/check-update') return handleCheckUpdate(req, res);



  // Serve static files
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  // Prevent directory traversal
  if (!filePath.startsWith(DIR)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Feature Tracker running at http://localhost:${PORT}`);
  console.log('Auto-sync will commit to git every 30 s after a change.');
});
