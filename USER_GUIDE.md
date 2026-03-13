# Feature Context Hub — User Guide

**Feature Context Hub** is a personal workspace for product designers to track every in-flight feature in one place. It replaces scattered Confluence notes, Slack threads, and browser bookmarks with a single file that keeps context, research, calls, and tasks together — organized per feature, always accessible offline.

---

## How to Open the App

> **Important:** Always open the app at **http://localhost:3456** — never by double-clicking `index.html`.
>
> Double-clicking the file opens it as `file://` which has completely separate storage from `localhost`. Your data will not show up there.

---

## Setup

### What you need

- [Node.js](https://nodejs.org) v18 or later
- [Git](https://git-scm.com)

### First-time setup

**1. Clone the repo**

```bash
git clone https://github.com/YOUR_USERNAME/feature-tracker.git
cd feature-tracker
```

**2. Start the server**

```bash
node server.js
```

You should see:
```
Feature Tracker running at http://localhost:3456
Auto-sync will commit to git every 30 s after a change.
```

**3. Open the app**

Open **http://localhost:3456** in your browser. Keep the terminal open while you work.

### Daily workflow

1. Open Terminal, `cd` into the `feature-tracker` folder
2. Run `node server.js`
3. Open **http://localhost:3456** in your browser
4. Work normally — data syncs automatically every 30 seconds
5. Before closing, confirm the sync indicator in the sidebar has turned green at least once

### Restoring on a new machine

```bash
git clone https://github.com/YOUR_USERNAME/feature-tracker.git
cd feature-tracker
node server.js
```

Open `http://localhost:3456` — your data loads automatically from the snapshot embedded in `index.html`.

---

## How Data is Saved

Data is stored in two places:

1. **Browser localStorage** — live working state, updates immediately as you work
2. **`index.html` embedded snapshot** — written by the server every 30 seconds after a change, committed to git

Every field saves automatically:
- Status, due date, current focus — on change
- Notes — on every keystroke
- Q&A answers, Domain Knowledge, Feature Brief — when you click away
- Call fields — on change
- Tasks — immediately on any action

You do **not** need to click the sync button to save your work. Data is in localStorage from the moment you type. The sync button (↻) only triggers an early git commit if you don't want to wait 30 seconds.

### What happens when you close the browser

Your data stays in localStorage. When you reopen `http://localhost:3456`, it loads from localStorage. The embedded snapshot in `index.html` is the backup used only when localStorage is empty (e.g. on a new machine after cloning).

---

## Sync Indicator (Sidebar Footer)

| Dot color | Meaning |
|-----------|---------|
| Grey | Server offline or idle |
| Blue (pulsing) | Sync in progress |
| Green | Synced — shows last sync time |
| Red | Sync failed |

Click the **↻ sync button** to force an immediate git commit without waiting 30 seconds. This is optional — auto-sync handles it automatically.

---

## Navigation

The left sidebar lists every feature with its current status badge. Click any feature to open it. At the top is **Schedule Overview**, a dashboard showing all features at once.

### Sidebar footer

| Icon | Action |
|------|--------|
| ↻ | Force sync to git now (optional) |
| Sun/Moon | Toggle light / dark theme |

---

## Schedule Overview

The landing page. Shows every feature as a card with:

- **Status badge** (Discovery / Design / Dev / QA / Done)
- **Customer** and **due date**
- **Current Focus** — what you are actively working on right now
- **Progress bar** — percentage of To Do tasks marked Done (postponed tasks excluded)

Click any card to jump to that feature's detail page.

---

## Adding a New Feature

Click the **+** button next to "Features" in the sidebar. Fill in:

- Title, icon, status, customer, due date
- Summary, current focus
- Team members

---

## Feature Detail Page

Each feature has a header with an editable **status dropdown** and **due date picker**, then a **Current Focus ribbon** you can update at any time.

Below that are tabs, each covering a different dimension of the feature.

---

## Tabs

### Context

A reference card showing the core feature brief:
- **Summary** — one-paragraph problem statement
- **Key Decisions** — confirmed design/product decisions
- **Constraints** — known limitations and out-of-scope items
- **Links** — Jira tickets, PRDs, Gong calls, design files
- **Team** — PM, Eng, stakeholders with their roles

---

### Domain Knowledge

A personal notebook for context you have built up over time — edge cases, mental models, integration quirks, anything not in the PRD.

- Click **+ Add** to create a new entry
- Entries are collapsible, editable, and deletable
- Title autosaves when you click away

---

### Feature Brief

Structured background context — architecture decisions, data models, domain deep-dives.

- Click **+ Add** to create a new entry
- Same collapsible/editable/deletable pattern as Domain Knowledge

---

### Calls

Log all calls related to a feature — customer discovery, internal syncs, design reviews.

#### Creating a call

Click **+ Add** and choose **Customer Call** or **Internal Call**. The call opens immediately in edit mode — no modal or popup. Fill in the fields directly:

- **Call Name** — primary identifier
- **Type** — Customer or Internal
- **Category** — Customer Discovery, Design Review, Internal Sync, etc.
- **Status** — Scheduled / Completed / Action Items Pending
- **Date**, **Customer**, **Attendees**, **Notes Link**
- **External Resources** — attach slides, recordings, or docs with a label and URL

Click the **edit icon** (pencil) on any existing call card to switch it to edit mode.

#### Call status chips

| Status | Color |
|--------|-------|
| Scheduled | Blue |
| Completed | Green |
| Action Items Pending | Yellow |

#### Inside each call — three tabs

**General Info** — call details, attendees, resources

**Call Prep** — structured pre-call preparation:
- Research Questions, Interviewee Background, Warm-up Questions, Topic Questions, Look For / Listen For
- Use **Copy prep prompt to Claude.ai** to generate AI-assisted prep

**Post Meeting** — paste the transcript; generate an AI summary with Claude

---

### Q&A

A question bank with tracked answers.

- Add questions with **+ Add**
- Answers support markdown
- Mark questions as **Resolved** when answered; filter by open/resolved

---

### Design Spec

Links and embeds for your design spec.

- Add spec links with **+ Add**
- Edit or delete existing specs

---

### Design Files

Links to Figma files, prototypes, or other design assets.

- Add links with **+ Add**
- Links open in a new tab

---

### Notes

A free-form scratchpad. Autosaves as you type.

---

### To Do

A unified task list for all work states.

| Status | Meaning |
|--------|---------|
| To Do | Not started |
| Done | Completed |
| Postponed | Deferred — stores a reason |

- Add tasks with **+ Add**
- Postpone a task to record why it is blocked
- Progress bar on Schedule Overview counts Done / (To Do + Done) — postponed tasks excluded

---

## Deleted Features

Deleted features appear in the **Deleted** section at the bottom of the sidebar.

- **Restore** — brings the feature back
- **Delete forever** — permanent removal (confirmation required)

---

## Status Workflow

| Status | Meaning |
|--------|---------|
| Discovery | Researching the problem |
| Design | Actively designing |
| Dev | Handed off to engineering |
| QA | In testing |
| Done | Shipped or closed |

---

## Tips

- **Always enter data at localhost:3456**, not by editing `index.html` directly
- **Start each session:** `node server.js` → open `http://localhost:3456`
- **Use Current Focus as a daily intent** — one sentence: what specifically needs to happen today on this feature
- **Log calls even before they happen** — create the call as Scheduled, fill in prep, paste the transcript after
- **Domain Knowledge is for things you learned, not things you were told** — if you had to figure it out, write it down so you never have to again
- **Postpone, don't delete** — if a task is blocked, postpone it with a reason so the context is preserved
- **Check the sync indicator is green** before closing your browser at the end of the day
