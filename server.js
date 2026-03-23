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
      cleanState.seed_version = Date.now();
      const seedTag = `<script id="fh-seed" type="application/json">\n${JSON.stringify(cleanState, null, 2)}\n</script>\n`;
      const initScriptMarker = '<script>const _prdEditing';
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
  console.log(`[req] ${req.method} ${req.url.slice(0, 100)}`);
  // CORS for same-machine requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-cf-email, x-cf-token');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.method === 'POST' && req.url === '/sync') return handleSync(req, res);
  if (req.method === 'GET' && req.url === '/api/check-update') return handleCheckUpdate(req, res);
  if (req.method === 'GET' && req.url.startsWith('/api/confluence/fetch')) return handleCFFetch(req, res);
  if (req.method === 'POST' && req.url === '/api/confluence/update') return handleCFUpdate(req, res);
  if (req.method === 'POST' && req.url === '/api/claude/parse') return handleClaudeParse(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/epic'))              return handleJiraEpicFetch(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/fields'))           return handleJiraFieldsFetch(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/comments'))         return handleJiraCommentsFetch(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/ticket/design-links')) return handleJiraDesignLinksFetch(req, res);
  if (req.method === 'POST' && req.url === '/api/jira/ticket/design-link')       return handleJiraDesignLinkCreate(req, res);
  if (req.method === 'DELETE' && req.url === '/api/jira/ticket/design-link')     return handleJiraDesignLinkDelete(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/ticket'))           return handleJiraTicketFetch(req, res);
  if (req.method === 'POST' && req.url === '/api/jira/ticket/push')              return handleJiraTicketPush(req, res);
  if (req.method === 'POST' && req.url === '/api/jira/comment')                  return handleJiraCommentPost(req, res);
  if (req.method === 'PUT'  && req.url.startsWith('/api/jira/ticket/property'))  return handleJiraTicketPropertyPut(req, res);
  if (req.method === 'GET'  && req.url.startsWith('/api/jira/attachment'))        return handleJiraAttachment(req, res);



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
      path: `/rest/api/3/issue/${epicKey}?fields=summary,issuetype,status`,
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    console.log(`[jira] epic fetch status=${epicRes.status} key=${epicKey} body=${epicRes.body.slice(0,500)} headers=${JSON.stringify(epicRes.headers)}`);
    if (epicRes.status !== 200) return sendJSON(res, epicRes.status, { ok: false, error: 'Could not fetch epic', details: epicRes.body });
    const epicData = JSON.parse(epicRes.body);
    // Fetch child tickets — use Jira API v3 (v2 search removed)
    async function jiraSearch(jql) {
      const payload = JSON.stringify({ jql, fields: ['id','key','summary','status','issuetype'], maxResults: 100 });
      const r = await httpsReq({
        hostname: domain, method: 'POST',
        path: `/rest/api/3/search/jql`,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, payload);
      console.log(`[jira] search jql="${jql.slice(0,50)}" status=${r.status} body=${r.body.slice(0,200)}`);
      if (r.status !== 200) return [];
      try { return JSON.parse(r.body).issues || []; } catch { return []; }
    }
    // Run both queries in parallel
    const [byParent, byEpicLink] = await Promise.all([
      jiraSearch(`parent=${epicKey} ORDER BY created ASC`),
      jiraSearch(`"Epic Link"=${epicKey} ORDER BY created ASC`)
    ]);
    // Merge, deduplicate by key
    const seen = new Set();
    const allIssues = [...byParent, ...byEpicLink].filter(i => {
      if (seen.has(i.key)) return false; seen.add(i.key); return true;
    });
    if (allIssues.length === 0) {
      // Last resort: try issueFunction subtasks
      const subtasks = await jiraSearch(`issueFunction in subtasksOf("${epicKey}")`);
      allIssues.push(...subtasks.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; }));
    }
    const items = allIssues.map(issue => ({
      id: issue.id, key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      type: issue.fields.issuetype.name,
      url: `https://${domain}/browse/${issue.key}`
    }));
    sendJSON(res, 200, { ok: true, epicKey, epicTitle: epicData.fields.summary, epicUrl: `https://${domain}/browse/${epicKey}`, domain, items });
  } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
}

// ── /api/jira/fields GET ──────────────────────────────────────────────────────
async function handleJiraFieldsFetch(req, res) {
  const params = new URL(req.url, 'http://x').searchParams;
  const domain = params.get('domain');
  if (!domain) return sendJSON(res, 400, { ok: false, error: 'Missing domain' });
  const email = req.headers['x-cf-email'], token = req.headers['x-cf-token'];
  if (!email || !token) return sendJSON(res, 400, { ok: false, error: 'Missing credentials' });
  try {
    const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
    const r = await httpsReq({
      hostname: domain, method: 'GET',
      path: '/rest/api/3/field',
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    if (r.status !== 200) return sendJSON(res, r.status, { ok: false, error: 'Failed to fetch fields' });
    const fields = JSON.parse(r.body);
    sendJSON(res, 200, {
      ok: true,
      fields: fields.map(f => ({ id: f.id, name: f.name, type: f.schema?.type || '', custom: !!f.custom }))
    });
  } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
}

// ── ADF helpers ──────────────────────────────────────────────────────────────
function adfToText(adf) {
  if (!adf) return '';
  if (typeof adf === 'string') return adf;
  const lines = [];
  for (const block of (adf.content || [])) {
    const inline = (block.content || []).map(n => {
      if (n.type === 'text') return n.text || '';
      if (n.type === 'hardBreak') return '\n';
      if (n.type === 'mention') return '@' + (n.attrs?.text || '');
      return '';
    }).join('');
    lines.push(inline);
  }
  return lines.join('\n\n');
}

function textToAdf(text) {
  if (!text || !text.trim()) return { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [] }] };
  const paras = text.split(/\n\n+/).filter(p => p.trim());
  return {
    type: 'doc', version: 1,
    content: paras.map(p => ({
      type: 'paragraph',
      content: p.split('\n').flatMap((line, i, arr) => {
        const nodes = [];
        if (line) nodes.push({ type: 'text', text: line });
        if (i < arr.length - 1) nodes.push({ type: 'hardBreak' });
        return nodes;
      })
    }))
  };
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
    const dodFieldId = params.get('dodFieldId') || null;
    const baseFields = 'summary,status,issuetype,description,assignee,reporter,priority,labels,issuelinks,updated,attachment';
    const fieldsParam = dodFieldId ? `${baseFields},${dodFieldId}` : baseFields;
    const [r, remoteR, propsR] = await Promise.all([
      httpsReq({
        hostname: domain, method: 'GET',
        path: `/rest/api/3/issue/${key}?fields=${fieldsParam}`,
        headers: { Authorization: auth, Accept: 'application/json' }
      }),
      httpsReq({
        hostname: domain, method: 'GET',
        path: `/rest/api/3/issue/${key}/remotelink`,
        headers: { Authorization: auth, Accept: 'application/json' }
      }),
      httpsReq({
        hostname: domain, method: 'GET',
        path: `/rest/api/3/issue/${key}/properties`,
        headers: { Authorization: auth, Accept: 'application/json' }
      })
    ]);
    if (r.status !== 200) return sendJSON(res, r.status, { ok: false, error: 'Ticket not found' });
    const d = JSON.parse(r.body);
    const f = d.fields;

    // Read design links from remote links — only include actual design tool links
    const DESIGN_DOMAINS = ['figma.com','sketch.cloud','zeplin.io','invisionapp.com','adobe.com','marvelapp.com','framer.com','canva.com','whimsical.com','miro.com'];
    function isDesignUrl(url) {
      try { const h = new URL(url).hostname.replace(/^www\./, ''); return DESIGN_DOMAINS.some(d => h === d || h.endsWith('.' + d)); } catch { return false; }
    }
    let designLinks = [];
    try {
      if (remoteR.status === 200) {
        const rawLinks = JSON.parse(remoteR.body);
        designLinks = rawLinks
          .filter(l => {
            const url = l.object?.url || '';
            const rel = (l.relationship || '').toLowerCase();
            return isDesignUrl(url) || rel.includes('design') || rel.includes('figma');
          })
          .map(l => ({
            id: l.id, url: l.object?.url || '', label: l.object?.title || (() => { try { return new URL(l.object?.url || '').hostname.replace(/^www\./, ''); } catch { return ''; } })(),
            relationship: l.relationship || '', source: 'remotelink',
            appType: l.application?.type || '', appName: l.application?.name || ''
          }));
      }
    } catch {}

    // Check known Jira design property keys (Jira's native "Add design" stores links here)
    let designPropertyKey = null;
    let designPropertyLinks = [];
    const DESIGN_PROP_CANDIDATES = [
      'com.atlassian.jira.designs',
      'designs',
      'design-url',
      'design-links',
    ];
    try {
      if (propsR.status === 200) {
        const propKeys = (JSON.parse(propsR.body).keys || []).map(k => k.key);
        console.log(`[jira] issue ${key} property keys: ${JSON.stringify(propKeys)}`);
        // First try known candidates, then any key containing "design"
        designPropertyKey = DESIGN_PROP_CANDIDATES.find(k => propKeys.includes(k))
          || propKeys.find(k => /design/i.test(k) && k !== 'com.atlassian.jira.designs-last-viewed')
          || null;
        if (designPropertyKey) {
          const valR = await httpsReq({
            hostname: domain, method: 'GET',
            path: `/rest/api/3/issue/${key}/properties/${encodeURIComponent(designPropertyKey)}`,
            headers: { Authorization: auth, Accept: 'application/json' }
          });
          if (valR.status === 200) {
            const val = JSON.parse(valR.body).value;
            console.log(`[jira] issue ${key} property ${designPropertyKey}: ${JSON.stringify(val).slice(0, 300)}`);
            const items = Array.isArray(val) ? val : (val?.designs || val?.urls || (val?.url ? [val] : []));
            designPropertyLinks = items.map((item, i) => ({
              id: `prop_${i}`, url: item.url || item, label: item.name || item.displayName || item.url || item,
              relationship: 'Design', source: 'property', propertyKey: designPropertyKey
            })).filter(l => l.url);
          }
        }
      }
    } catch(e) { console.log(`[jira] property fetch error: ${e.message}`); }

    // Merge: property links take precedence over remote links for the same URL
    const propertyUrls = new Set(designPropertyLinks.map(l => l.url));
    const mergedDesignLinks = [
      ...designPropertyLinks,
      ...designLinks.filter(l => !propertyUrls.has(l.url))
    ];

    if ((f.attachment||[]).length) console.log(`[jira] ${key} returning ${(f.attachment||[]).length} attachments to client`);
    sendJSON(res, 200, {
      ok: true, key: d.key,
      summary: f.summary,
      status: f.status.name,
      descriptionAdf: f.description || null,
      attachments: (f.attachment || []).map(a => ({ id: a.id, filename: a.filename, mimeType: a.mimeType, contentUrl: a.content })),
      dodFieldValue: dodFieldId ? (f[dodFieldId] || null) : undefined,
      updatedAt: f.updated || null,
      designLinks: mergedDesignLinks,
      designPropertyKey,
      assignee: f.assignee ? { name: f.assignee.displayName, avatar: (f.assignee.avatarUrls||{})['24x24'] || null } : null,
      reporter: f.reporter ? { name: f.reporter.displayName } : null,
      priority: f.priority ? f.priority.name : null,
      labels: f.labels || [],
      relatedWork: (f.issuelinks || []).map(l => ({
        type: l.type?.name || 'relates to',
        direction: l.outwardIssue ? 'outward' : 'inward',
        label: l.outwardIssue ? (l.type?.outward || 'outward') : (l.type?.inward || 'inward'),
        key: (l.outwardIssue || l.inwardIssue)?.key || '',
        summary: (l.outwardIssue || l.inwardIssue)?.fields?.summary || '',
        status: (l.outwardIssue || l.inwardIssue)?.fields?.status?.name || '',
        url: ''
      })),
      url: `https://${domain}/browse/${d.key}`
    });
  } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
}

// ── /api/jira/ticket/push POST ───────────────────────────────────────────────
function handleJiraTicketPush(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { domain, email, token, ticketKey, summary, descriptionAdf, dodFieldId, dodAdf, designFieldId, designLinkUrl } = JSON.parse(body);
      const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');

      // Build issue fields update
      const issueFields = {};
      if (summary !== undefined && summary !== null) issueFields.summary = summary;
      if (descriptionAdf !== undefined && descriptionAdf !== null) issueFields.description = descriptionAdf;
      // Write DoD to its custom field if provided (bypasses description)
      if (dodFieldId && dodAdf !== undefined && dodAdf !== null) issueFields[dodFieldId] = dodAdf;
      // Write design link to its custom field if provided
      if (designFieldId && designLinkUrl !== undefined) issueFields[designFieldId] = designLinkUrl || null;

      if (Object.keys(issueFields).length === 0) {
        return sendJSON(res, 400, { ok: false, error: 'Nothing to update' });
      }

      const issuePayload = JSON.stringify({ fields: issueFields });
      const issueRes = await httpsReq({
        hostname: domain, method: 'PUT',
        path: `/rest/api/3/issue/${ticketKey}`,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(issuePayload) }
      }, issuePayload);
      // Jira returns 204 No Content on success
      if (![200, 201, 204].includes(issueRes.status)) {
        return sendJSON(res, issueRes.status, { ok: false, error: 'Failed to update Jira issue', details: issueRes.body });
      }
      sendJSON(res, 200, { ok: true });
    } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
  });
}

// ── /api/jira/comments GET ────────────────────────────────────────────────────
async function handleJiraCommentsFetch(req, res) {
  const params = new URL(req.url, 'http://x').searchParams;
  const key = params.get('key'), domain = params.get('domain');
  if (!key || !domain) return sendJSON(res, 400, { ok: false, error: 'Missing key or domain' });
  const email = req.headers['x-cf-email'], token = req.headers['x-cf-token'];
  if (!email || !token) return sendJSON(res, 400, { ok: false, error: 'Missing credentials' });
  try {
    const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
    const r = await httpsReq({
      hostname: domain, method: 'GET',
      path: `/rest/api/3/issue/${key}/comment?maxResults=50&orderBy=created`,
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    if (r.status !== 200) return sendJSON(res, r.status, { ok: false, error: 'Failed to load comments' });
    const d = JSON.parse(r.body);
    sendJSON(res, 200, {
      ok: true,
      comments: (d.comments || []).map(c => ({
        id: c.id,
        author: c.author?.displayName || 'Unknown',
        created: c.created,
        bodyAdf: c.body || null
      }))
    });
  } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
}

// ── /api/jira/ticket/design-links GET ────────────────────────────────────────
async function handleJiraDesignLinksFetch(req, res) {
  const params = new URL(req.url, 'http://x').searchParams;
  const key = params.get('key'), domain = params.get('domain');
  if (!key || !domain) return sendJSON(res, 400, { ok: false, error: 'Missing key or domain' });
  const email = req.headers['x-cf-email'], token = req.headers['x-cf-token'];
  if (!email || !token) return sendJSON(res, 400, { ok: false, error: 'Missing credentials' });
  try {
    const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
    const r = await httpsReq({
      hostname: domain, method: 'GET',
      path: `/rest/api/3/issue/${key}/remotelink`,
      headers: { Authorization: auth, Accept: 'application/json' }
    });
    if (r.status !== 200) return sendJSON(res, r.status, { ok: false, error: 'Failed to fetch design links' });
    const links = JSON.parse(r.body);
    sendJSON(res, 200, {
      ok: true,
      designLinks: links.map(l => ({ id: l.id, url: l.object?.url || '', label: l.object?.title || '', relationship: l.relationship || '' }))
    });
  } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
}

// ── /api/jira/ticket/design-link POST ─────────────────────────────────────────
function handleJiraDesignLinkCreate(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { domain, email, token, ticketKey, url, label, propertyKey } = JSON.parse(body);
      if (!domain || !email || !token || !ticketKey || !url) return sendJSON(res, 400, { ok: false, error: 'Missing required fields' });
      const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');

      // Primary: write to Jira issue property (this is what Jira's native "Add design" uses)
      // Try com.atlassian.jira.designs, or the discovered propertyKey from the ticket
      const targetPropKey = propertyKey || 'com.atlassian.jira.designs';
      const propValue = JSON.stringify([{ url, name: label || url, displayName: label || url }]);
      const propR = await httpsReq({
        hostname: domain, method: 'PUT',
        path: `/rest/api/3/issue/${ticketKey}/properties/${encodeURIComponent(targetPropKey)}`,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(propValue) }
      }, propValue);
      console.log(`[jira] design property PUT ${targetPropKey} on ${ticketKey}: status=${propR.status} body=${propR.body.slice(0,200)}`);

      // Also write as remote link (fallback for visibility in other Jira views)
      const isFigma = url.includes('figma.com');
      const rlPayload = JSON.stringify({
        globalId: `feature-hub:design:${ticketKey}`,
        application: { type: 'com.feature-hub', name: 'Design' },
        relationship: 'Design',
        object: {
          url, title: label || url,
          icon: { url16x16: isFigma ? 'https://static.figma.com/app/icon/1/favicon.png' : '', title: isFigma ? 'Figma' : 'Design' }
        }
      });
      const rlR = await httpsReq({
        hostname: domain, method: 'POST',
        path: `/rest/api/3/issue/${ticketKey}/remotelink`,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(rlPayload) }
      }, rlPayload);
      console.log(`[jira] design remotelink POST on ${ticketKey}: status=${rlR.status}`);

      const propOk = [200, 201, 204].includes(propR.status);
      const rlOk = [200, 201].includes(rlR.status);
      if (!propOk && !rlOk) return sendJSON(res, propR.status, { ok: false, error: 'Failed to save design link', details: propR.body });
      let id = null;
      try { if (rlOk) id = JSON.parse(rlR.body).id; } catch {}
      sendJSON(res, 200, { ok: true, id, propertyKey: propOk ? targetPropKey : null });
    } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
  });
}

// ── /api/jira/ticket/design-link DELETE ───────────────────────────────────────
function handleJiraDesignLinkDelete(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { domain, email, token, ticketKey, linkId } = JSON.parse(body);
      if (!domain || !email || !token || !ticketKey || linkId == null) return sendJSON(res, 400, { ok: false, error: 'Missing required fields' });
      const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
      const r = await httpsReq({
        hostname: domain, method: 'DELETE',
        path: `/rest/api/3/issue/${ticketKey}/remotelink/${linkId}`,
        headers: { Authorization: auth, Accept: 'application/json' }
      });
      if (![200, 204].includes(r.status)) return sendJSON(res, r.status, { ok: false, error: 'Failed to delete design link', details: r.body });
      sendJSON(res, 200, { ok: true });
    } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
  });
}

// ── /api/jira/attachment GET ──────────────────────────────────────────────────
// Proxies Jira attachment content (images etc.) with auth headers
async function handleJiraAttachment(req, res) {
  console.log('[attach] handler called:', req.url.slice(0, 120));
  try {
    const u = new URL('http://x' + req.url);
    const email = u.searchParams.get('email');
    const token = u.searchParams.get('token');
    if (!email || !token) { res.writeHead(400); res.end('Missing params'); return; }
    const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');

    // Accept direct content URL (from attachment list) or fallback to id lookup
    let contentUrl = u.searchParams.get('contentUrl');
    let mimeType = u.searchParams.get('mimeType') || 'image/png';
    if (!contentUrl) {
      const id = u.searchParams.get('id');
      const domain = u.searchParams.get('domain');
      if (!id || !domain) { res.writeHead(400); res.end('Missing params'); return; }
      const meta = await httpsReq({
        hostname: domain, method: 'GET',
        path: `/rest/api/3/attachment/${encodeURIComponent(id)}`,
        headers: { Authorization: auth, Accept: 'application/json' }
      });
      if (meta.status !== 200) { res.writeHead(meta.status); res.end('Attachment not found'); return; }
      const metaJson = JSON.parse(meta.body);
      contentUrl = metaJson.content;
      mimeType = metaJson.mimeType || mimeType;
      if (!contentUrl) { res.writeHead(404); res.end('No content URL'); return; }
    }

    // Fetch the actual file content, following up to 3 redirects
    const https = require('https');
    function fetchUrl(url, headers, redirectsLeft) {
      return new Promise((resolve, reject) => {
        const p = new URL(url);
        const r = https.request({ hostname: p.hostname, path: p.pathname + p.search, method: 'GET', headers }, resp => {
          if ([301,302,303,307,308].includes(resp.statusCode) && resp.headers.location && redirectsLeft > 0) {
            resp.resume(); // drain so the connection is freed
            const nextUrl = resp.headers.location.startsWith('http')
              ? resp.headers.location
              : `${p.protocol}//${p.host}${resp.headers.location}`;
            // Don't forward auth to external redirects (e.g. S3 pre-signed URLs)
            const nextHeaders = new URL(nextUrl).hostname === p.hostname ? headers : {};
            resolve(fetchUrl(nextUrl, nextHeaders, redirectsLeft - 1));
          } else {
            const chunks = [];
            resp.on('data', d => chunks.push(d));
            resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: Buffer.concat(chunks) }));
          }
        });
        r.on('error', reject); r.end();
      });
    }
    const fileReq = await fetchUrl(contentUrl, { Authorization: auth }, 3);
    console.log('[attach] status:', fileReq.status, 'bytes:', fileReq.body?.length);
    if (fileReq.status !== 200) { res.writeHead(fileReq.status); res.end(); return; }
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(fileReq.body);
  } catch(e) { res.writeHead(500); res.end(e.message); }
}

// ── /api/jira/ticket/property PUT ─────────────────────────────────────────────
// Writes a value to a Jira issue property (used for design links in the Designs section)
function handleJiraTicketPropertyPut(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { domain, email, token, ticketKey, propertyKey, value } = JSON.parse(body);
      if (!domain || !email || !token || !ticketKey || !propertyKey) return sendJSON(res, 400, { ok: false, error: 'Missing required fields' });
      const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
      const payload = JSON.stringify(value);
      const r = await httpsReq({
        hostname: domain, method: 'PUT',
        path: `/rest/api/3/issue/${ticketKey}/properties/${encodeURIComponent(propertyKey)}`,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, payload);
      console.log(`[jira] property PUT ${propertyKey} on ${ticketKey}: status=${r.status} body=${r.body.slice(0,200)}`);
      if (![200, 201, 204].includes(r.status)) return sendJSON(res, r.status, { ok: false, error: 'Failed to write property', details: r.body });
      sendJSON(res, 200, { ok: true });
    } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
  });
}

// ── /api/jira/comment POST ────────────────────────────────────────────────────
function handleJiraCommentPost(req, res) {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', async () => {
    try {
      const { domain, email, token, ticketKey, text } = JSON.parse(body);
      if (!domain || !email || !token || !ticketKey || !text) return sendJSON(res, 400, { ok: false, error: 'Missing required fields' });
      const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
      const commentAdf = { version: 1, type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
      const payload = JSON.stringify({ body: commentAdf });
      const r = await httpsReq({
        hostname: domain, method: 'POST',
        path: `/rest/api/3/issue/${ticketKey}/comment`,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, payload);
      if (![200, 201].includes(r.status)) return sendJSON(res, r.status, { ok: false, error: 'Failed to post comment', details: r.body });
      const created = JSON.parse(r.body);
      sendJSON(res, 200, { ok: true, id: created.id, created: created.created });
    } catch(e) { sendJSON(res, 500, { ok: false, error: e.message }); }
  });
}
