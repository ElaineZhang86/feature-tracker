# Feature Hub — Data Loss Root Causes & Fixes

This document explains why data (tasks, notes, DK entries) disappeared from the Feature Hub and how each issue was fixed. Use this as a reference if data goes missing again.

---

## How Data Storage Works

The app has **three layers** of storage that must stay in sync:

```
in-memory STATE  ←→  localStorage (fh_state)  ←→  fh-seed in index.html  ←→  GitHub sync
```

1. **`STATE`** — JavaScript object in memory, the live source of truth while the page is open
2. **`localStorage`** — persists data across reloads (browser-side, ~5MB limit)
3. **`fh-seed`** — a `<script id="fh-seed">` tag embedded in `index.html` by the server on every `/sync` POST; used to recover data if localStorage is wiped
4. **GitHub sync** — pushes a JSON snapshot to a GitHub repo as backup

On page load, the startup sequence is:
```
loadFromSeed() → STATE = loadState() → merge seed into STATE → init() → initGHSync()
```

---

## Root Cause #1 — `getNoteEntries` read from stale localStorage instead of live STATE

**Symptom:** Notes typed into the app disappeared immediately (not just on reload).

**Why:** `getNoteEntries(id)` was calling `loadState()[id]` — which reads from `localStorage` — instead of `getFeatureState(id)` which reads from in-memory `STATE`. Since `saveState()` updates `STATE` first and then writes to localStorage, there was a window where the two diverged.

**Fix:**
```js
// Before (broken)
function getNoteEntries(id) {
  const s = loadState()[id] || {};
  ...
}

// After (fixed)
function getNoteEntries(id) {
  const s = getFeatureState(id);  // reads in-memory STATE
  ...
}
```

**Rule:** All getters must use `getFeatureState(id)` (in-memory), never `loadState()[id]` (localStorage re-read).

---

## Root Cause #2 — localStorage quota exceeded, save failed silently

**Symptom:** "Storage is full" error. Data saved during the session but disappeared on reload.

**Why:** Jira ticket descriptions and comments loaded from Jira filled up the ~5MB localStorage quota. When `saveState()` called `localStorage.setItem(...)`, it threw a QuotaExceededError that was silently swallowed — the save appeared to succeed but nothing was written.

**Fix — `_writeState()` with automatic retry:**
```js
function _writeState(state) {
  try {
    localStorage.setItem('fh_state', JSON.stringify(_slimStateForStorage(state)));
    return true;
  } catch(e) {
    clearJiraCache(true);   // strips Jira-fetched fields from STATE
    try {
      localStorage.setItem('fh_state', JSON.stringify(_slimStateForStorage(STATE)));
      return true;
    } catch(e2) {
      return false;          // shows error toast to user
    }
  }
}
```

**`_slimStateForStorage()`** strips Jira-fetched descriptions and comments before writing (keeps only user-edited content).

**`saveState()`** now shows a visible error toast if the save fails even after cleanup.

---

## Root Cause #3 — `getFullState()` read stale localStorage instead of live STATE

**Symptom:** Data the user entered in the session was not included in the next auto-sync or GitHub push — effectively lost when the page was refreshed.

**Why:** `getFullState()` was calling `loadState()` (re-reads localStorage) instead of returning `STATE` directly. If a localStorage write had failed (quota error), `loadState()` returned the old data.

**Fix:**
```js
// Before (broken)
function getFullState() {
  return { fh_state: loadState(), ... };
}

// After (fixed)
function getFullState() {
  return { fh_state: STATE, ... };  // always use in-memory STATE
}
```

---

## Root Cause #4 — `_ghMergeData` replaced localStorage instead of merging

**Symptom:** All data wiped when GitHub sync ran and fetched older data from the remote.

**Why:** `_ghMergeData(data)` was doing:
```js
localStorage.setItem('fh_state', JSON.stringify(data.fh_state));
```
This **completely replaced** localStorage with whatever was in the GitHub file — even if GitHub had older/incomplete data.

**Fix:** Merge only — fill fields that are missing locally, never overwrite existing data:
```js
function _ghMergeData(data) {
  if (data.fh_state) {
    const cur = loadState();
    Object.keys(data.fh_state).forEach(fid => {
      if (!cur[fid]) { cur[fid] = data.fh_state[fid]; return; }
      Object.keys(data.fh_state[fid]).forEach(k => {
        if (isEmpty(cur[fid][k]) && !isEmpty(data.fh_state[fid][k]))
          cur[fid][k] = data.fh_state[fid][k];
      });
    });
    localStorage.setItem('fh_state', JSON.stringify(cur));
  }
}
```

---

## Root Cause #5 — `initGHSync` reset STATE from stale localStorage after fetching GitHub data

**Symptom:** Data correctly loaded from seed disappeared a second or two after page load.

**Why:** After fetching the GitHub backup file, `initGHSync()` was calling:
```js
STATE = loadState();
init();
```
This re-read STATE from localStorage (potentially stale/empty) and re-ran `init()`, wiping all the data that had been correctly loaded from the seed into memory.

**Fix:** Merge GitHub data directly into the live in-memory `STATE`, never reset it:
```js
async function initGHSync() {
  const data = await _ghFetchFile(cfg);
  if (data) {
    if (data.fh_state) {
      Object.keys(data.fh_state).forEach(fid => {
        const remote = data.fh_state[fid];
        if (!STATE[fid]) { STATE[fid] = remote; return; }
        Object.keys(remote).forEach(k => {
          if (isEmpty(STATE[fid][k]) && !isEmpty(remote[k]))
            STATE[fid][k] = remote[k];
        });
      });
    }
    _ghMergeData(data);   // still update localStorage + custom features
  }
}
```

---

## Root Cause #6 — `seed_version` logic caused seed to always be skipped

**Symptom:** Data was in the `fh-seed` tag but never loaded into the page.

**Why (part A):** The server was writing `seed_version = Date.now()` — a regular timestamp. But the browser had previously stored `fh_seed_version = Date.now() + 1_000_000_000_000` (a far-future value from an earlier fix). Since `seedVer < lastLoaded`, `isNewSeed = false` → seed skipped.

**Fix:** Server always writes `seed_version = Date.now() + 1_000_000_000_000` so it's always ahead of any previously stored version.

**Why (part B — circular skip):** The auto-sync embeds the browser's STATE as the seed with version V. The browser stores `fh_seed_version = V`. On the next reload, the same V is served → `isNewSeed = V > V = false` → seed skipped.

**Fix:** Changed the skip condition from `>` to `>=` so the seed always re-merges:
```js
const isNewSeed = seedVer >= lastLoaded;  // was: seedVer > lastLoaded
```

---

## Root Cause #7 — Seed merge restored intentionally deleted data

**Symptom:** User deleted notes; after page refresh, notes reappeared.

**Why:** The merge logic treated `[]` (empty array) as "empty/missing" and refilled it from the seed. But `[]` means the user cleared it intentionally.

**Fix:** Only fill fields that are completely absent (`undefined`), not empty:
```js
// Before (broken) — treated [] as missing
if (!isEmpty(seedVal) && isEmpty(localVal)) { mergedState[fid][key] = seedVal; }

// After (fixed) — only fill if key literally doesn't exist
if (localVal === undefined && seedVal !== undefined) { mergedState[fid][key] = seedVal; }
```

---

## Data Recovery Process (if data goes missing again)

1. **Check git log** for recent auto-sync commits — they embed the browser's STATE:
   ```bash
   git log --oneline | head -20
   ```

2. **Find the last commit with the data you need:**
   ```bash
   for sha in $(git log --oneline | awk '{print $1}' | head -60); do
     git show $sha:index.html | python3 -c "
   import sys,json,re
   m=re.search(r'<script id=\"fh-seed\"[^>]*>([\s\S]*?)</script>', sys.stdin.read())
   if m:
     d=json.loads(m.group(1))
     fh=d.get('fh_state',{})
     print('$sha', {k:len(v.get('tasks',[])) for k,v in fh.items() if v.get('tasks')})
   " 2>/dev/null
   done
   ```

3. **Extract and re-inject the data** into the current seed (the Python script used historically is in git history — search commits with message "restore all data").

4. **Bump `seed_version`** to `Date.now() + 1_000_000_000_000` so the browser loads it.

5. **Restart the server** so it serves the updated `index.html`.

---

## Quick Diagnostics Checklist

| Symptom | Most likely cause | Where to look |
|---|---|---|
| Data disappears immediately (same session) | `getFeatureState` vs `loadState` mismatch | Any getter function |
| Data saves but vanishes on reload | localStorage quota exceeded | Check for `_writeState` returning false / error toast |
| Data gone after GitHub sync | `_ghMergeData` overwriting or `initGHSync` resetting STATE | `initGHSync`, `_ghMergeData` |
| Seed data not loading | `seed_version` skip logic | `loadFromSeed`, compare `fh_seed_version` in localStorage vs seed |
| Deleted data reappears on reload | Seed merge treating `[]` as empty | `isEmpty` check in `loadFromSeed` merge loop |
| Data in git history but not on page | Seed not injected / server not restarted | Re-run data recovery process above |

