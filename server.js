#!/usr/bin/env node
// Feature Tracker — local git-sync server
// Run with: node server.js
// Then open: http://localhost:3457

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
  if (req.method === 'GET' && req.url.startsWith('/api/confluence/fetch')) return handleCFFetch(req, res);
  if (req.method === 'POST' && req.url === '/api/confluence/update') return handleCFUpdate(req, res);
  if (req.method === 'POST' && req.url === '/api/claude/parse') return handleClaudeParse(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/epic'))       return handleJiraEpicFetch(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/ticket'))     return handleJiraTicketFetch(req, res);
  if (req.method === 'POST' && req.url === '/api/jira/ticket/push')        return handleJiraTicketPush(req, res);



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
  console.log(`Feature Hub running at http://localhost:${PORT}`);
  console.log('Auto-sync will commit to git every 30 s after a change.');
});

// ── HTTPS helper ────────────────────────────────────────────────────────────
const https = require('https');

function httpsReq(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString()
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Resolve Confluence tiny/short URL to page ID ────────────────────────────
async function resolvePageId(domain, urlPath, auth) {
  // Follow up to 5 redirects, extracting page ID along the way
  let currentPath = urlPath;
  for (let i = 0; i < 5; i++) {
    // Check current path for page ID
    const direct = currentPath.match(/\/pages\/(\d+)/);
    if (direct) return direct[1];
    const qm = currentPath.match(/[?&]pageId=(\d+)/);
    if (qm) return qm[1];

    // Make request and follow redirect
    const res = await httpsReq({ hostname: domain, path: currentPath, method: 'GET', headers: { Authorization: auth } });
    if (![301, 302, 307, 308].includes(res.status) || !res.headers.location) break;

    const loc = res.headers.location;
    // Check redirect target for page ID immediately
    const m = loc.match(/\/pages\/(\d+)/) || loc.match(/[?&]pageId=(\d+)/);
    if (m) return m[1];
    // Continue following
    currentPath = loc.startsWith('http') ? new URL(loc).pathname + new URL(loc).search : loc;
  }
  throw new Error('Could not resolve Confluence page ID from: ' + urlPath);
}

// ── /api/confluence/fetch ───────────────────────────────────────────────────
async function handleCFFetch(req, res) {
  const qUrl = new URL(req.url, 'http://x').searchParams.get('url');
  if (!qUrl) return sendJSON(res, 400, { ok: false, error: 'Missing url' });
  const email = req.headers['x-cf-email'];
  const token = req.headers['x-cf-token'];
  if (!email || !token) return sendJSON(res, 400, { ok: false, error: 'Missing Confluence credentials' });
  try {
    const parsed = new URL(qUrl);
    const domain = parsed.hostname;
    const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
    const pageId = await resolvePageId(domain, parsed.pathname + parsed.search, auth);
    const apiRes = await httpsReq({
      hostname: domain,
      path: `/wiki/rest/api/content/${pageId}?expand=body.storage,version`,
      method: 'GET',
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    if (apiRes.status !== 200) return sendJSON(res, apiRes.status, { ok: false, error: 'Confluence API error', details: apiRes.body });
    const data = JSON.parse(apiRes.body);
    sendJSON(res, 200, { ok: true, pageId: data.id, title: data.title, version: data.version.number, content: data.body.storage.value });
  } catch (e) {
    sendJSON(res, 500, { ok: false, error: e.message });
  }
}

// ── /api/confluence/update ──────────────────────────────────────────────────
function handleCFUpdate(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { domain, pageId, title, content, email, token } = JSON.parse(body);
      const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');

      // Always fetch the live version first to avoid stale-version 409 conflicts
      const getRes = await httpsReq({
        hostname: domain,
        path: `/wiki/rest/api/content/${pageId}?expand=version`,
        method: 'GET',
        headers: { Authorization: auth, Accept: 'application/json' }
      });
      if (getRes.status !== 200) return sendJSON(res, getRes.status, { ok: false, error: 'Could not fetch current page version', details: getRes.body });
      const currentVersion = JSON.parse(getRes.body).version.number;

      const payload = JSON.stringify({ version: { number: currentVersion + 1 }, title, type: 'page', body: { storage: { value: content, representation: 'storage' } } });
      const r = await httpsReq({
        hostname: domain,
        path: `/wiki/rest/api/content/${pageId}`,
        method: 'PUT',
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, payload);
      if (r.status !== 200) return sendJSON(res, r.status, { ok: false, error: 'Confluence update error', details: r.body });
      sendJSON(res, 200, { ok: true, newVersion: currentVersion + 1 });
    } catch (e) {
      sendJSON(res, 500, { ok: false, error: e.message });
    }
  });
}

// ── /api/claude/parse ───────────────────────────────────────────────────────
function handleClaudeParse(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { content, apiKey } = JSON.parse(body);
      const prompt = `You are parsing a Confluence PRD. Extract structured information and return ONLY a valid JSON object with no markdown fences or explanation.

Fields (use empty string/array if not present):
{
  "summary": "one paragraph problem statement",
  "keyDecisions": ["decision text"],
  "team": [{"name": "...", "role": "..."}],
  "links": [{"label": "...", "url": "..."}],
  "featureBriefEntries": [{"title": "...", "content": "..."}],
  "domainKnowledge": [{"title": "...", "content": "..."}],
  "questions": ["question text"],
  "tasks": ["task text"]
}

Confluence page content:
${content.slice(0, 60000)}`;

      const payload = JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] });
      const r = await httpsReq({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) }
      }, payload);
      if (r.status !== 200) return sendJSON(res, r.status, { ok: false, error: 'Claude API error', details: r.body });
      const d = JSON.parse(r.body);
      const text = d.content[0].text.trim().replace(/^```json\s*/,'').replace(/\s*```$/,'');
      sendJSON(res, 200, { ok: true, data: JSON.parse(text) });
    } catch (e) {
      sendJSON(res, 500, { ok: false, error: e.message });
    }
  });
}

// ── /api/jira/epic GET ──────────────────────────────────────────────────────
async function handleJiraEpicFetch(req, res) {
  const params = new URL(req.url, 'http://x').searchParams;
  const epicUrl = params.get('url');
  if (!epicUrl) return sendJSON(res, 400, { ok: false, error: 'Missing url' });
  const email = req.headers['x-cf-email'];
  const token = req.headers['x-cf-token'];
  if (!email || !token) return sendJSON(res, 400, { ok: false, error: 'Missing credentials' });
  try {
    const parsed = new URL(epicUrl);
    const domain = parsed.hostname;
    const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
    const keyMatch = (parsed.pathname + parsed.search).match(/\/browse\/([A-Z]+-\d+)/i);
    if (!keyMatch) return sendJSON(res, 400, { ok: false, error: 'Could not extract issue key from URL' });
    const epicKey = keyMatch[1].toUpperCase();
    // Fetch epic details
    const epicRes = await httpsReq({
      hostname: domain, method: 'GET',
      path: `/rest/api/2/issue/${epicKey}?fields=summary,issuetype,status`,
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    if (epicRes.status !== 200) return sendJSON(res, epicRes.status, { ok: false, error: 'Could not fetch epic', details: epicRes.body });
    const epicData = JSON.parse(epicRes.body);
    // Fetch child tickets via JQL
    const jql = encodeURIComponent(`parent=${epicKey} ORDER BY created ASC`);
    const searchRes = await httpsReq({
      hostname: domain, method: 'GET',
      path: `/rest/api/2/search?jql=${jql}&fields=id,key,summary,status,issuetype&maxResults=100`,
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    if (searchRes.status !== 200) return sendJSON(res, searchRes.status, { ok: false, error: 'Could not fetch child tickets', details: searchRes.body });
    const searchData = JSON.parse(searchRes.body);
    const items = searchData.issues.map(issue => ({
      id: issue.id, key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      type: issue.fields.issuetype.name,
      url: `https://${domain}/browse/${issue.key}`
    }));
    sendJSON(res, 200, { ok: true, epicKey, epicTitle: epicData.fields.summary, epicUrl: `https://${domain}/browse/${epicKey}`, domain, items });
  } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
}

// ── /api/jira/ticket GET ─────────────────────────────────────────────────────
async function handleJiraTicketFetch(req, res) {
  const params = new URL(req.url, 'http://x').searchParams;
  const key = params.get('key');
  const domain = params.get('domain');
  if (!key || !domain) return sendJSON(res, 400, { ok: false, error: 'Missing key or domain' });
  const email = req.headers['x-cf-email'];
  const token = req.headers['x-cf-token'];
  if (!email || !token) return sendJSON(res, 400, { ok: false, error: 'Missing credentials' });
  try {
    const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
    const r = await httpsReq({
      hostname: domain, method: 'GET',
      path: `/rest/api/2/issue/${key}?fields=summary,status,issuetype`,
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    if (r.status !== 200) return sendJSON(res, r.status, { ok: false, error: 'Ticket not found' });
    const d = JSON.parse(r.body);
    sendJSON(res, 200, { ok: true, key: d.key, summary: d.fields.summary, status: d.fields.status.name, url: `https://${domain}/browse/${d.key}` });
  } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
}

// ── /api/jira/ticket/push POST ───────────────────────────────────────────────
function handleJiraTicketPush(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { domain, email, token, ticketKey, designLink, requirements, specNotes } = JSON.parse(body);
      const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
      const MARKER = '[Feature Hub Design Spec]';
      const lines = [MARKER];
      if (designLink)   lines.push('\nDesign: ' + designLink);
      if (requirements) lines.push('\nRequirements:\n' + requirements);
      if (specNotes)    lines.push('\nSpec Notes:\n' + specNotes);
      lines.push('\n_Last synced from Feature Hub: ' + new Date().toISOString().replace('T',' ').slice(0,16) + '_');
      const commentBody = lines.join('\n');
      // Check for existing Feature Hub comment
      const commentsRes = await httpsReq({
        hostname: domain, method: 'GET',
        path: `/rest/api/2/issue/${ticketKey}/comment?maxResults=100`,
        headers: { Authorization: auth, Accept: 'application/json' }
      });
      let commentId = null;
      if (commentsRes.status === 200) {
        const cd = JSON.parse(commentsRes.body);
        const existing = cd.comments.find(c => (c.body || '').includes(MARKER));
        if (existing) commentId = existing.id;
      }
      const payload = JSON.stringify({ body: commentBody });
      const pushRes = await httpsReq({
        hostname: domain,
        path: commentId ? `/rest/api/2/issue/${ticketKey}/comment/${commentId}` : `/rest/api/2/issue/${ticketKey}/comment`,
        method: commentId ? 'PUT' : 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, payload);
      if (![200, 201].includes(pushRes.status)) return sendJSON(res, pushRes.status, { ok: false, error: 'Jira comment error', details: pushRes.body });
      const pd = JSON.parse(pushRes.body);
      sendJSON(res, 200, { ok: true, commentId: pd.id });
    } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
  });
}
