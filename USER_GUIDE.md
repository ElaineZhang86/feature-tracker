# Feature Context Hub — User Guide

**Feature Context Hub** is a personal workspace for product designers to track every in-flight feature in one place. It replaces scattered Confluence notes, Slack threads, and browser bookmarks with a single file that keeps context, research, calls, and tasks together — organized per feature, always accessible offline.

---

## Running the App

Feature Context Hub runs as a local web app backed by a Node.js server that auto-saves your data to git.

### Start the server

```bash
cd feature-tracker
node server.js
```

Then open **http://localhost:3456** in your browser. Keep the terminal open while you work.

### What the server does

- Serves the app at `localhost:3456`
- Every time you make a change, a 30-second timer starts. When it fires, the server embeds your full state into `index.html` and commits it to git. Rapid changes are batched — only one commit is made after you stop editing.
- Optionally pushes to your remote (GitHub, etc.) if one is configured.

### Sync indicator (sidebar footer)

| Dot color | Meaning |
|-----------|---------|
| Grey | Server offline or idle |
| Blue (pulsing) | Sync queued / in progress |
| Green | Synced — shows last sync time |
| Red | Sync failed |

Click the **sync button** (↻) next to the indicator to force an immediate sync without waiting 30 seconds.

### Restoring data on a new machine

When you `git clone` the repo and open the app for the first time, your saved state is loaded from the snapshot embedded in `index.html` — no manual import needed. After that, localStorage takes over and the embedded snapshot updates with every auto-commit.

### Recommended workflow

1. `node server.js` — start once at the beginning of your session
2. Open `http://localhost:3456`
3. Work normally — data saves automatically every 30 seconds
4. At the end of the day, confirm the sync indicator turned green at least once

---

## Navigation

The left sidebar lists every feature with its current status badge. Click any feature to open it. At the top is **Schedule Overview**, a dashboard that shows all features at once.

### Sidebar footer icons

| Icon | Action |
|------|--------|
| ↻ | Force sync to git now |
| Sun/Moon | Toggle light / dark theme |

---

## Schedule Overview

The landing page. Shows every feature as a card with:

- **Status badge** (Discovery / Design / Dev / QA / Done)
- **Customer** and **due date**
- **Current Focus** — what you are actively working on right now
- **Progress bar** — percentage of To Do tasks marked Done (postponed tasks excluded)

Click any card to jump to that feature's detail page.

**Problem it solves:** When you are juggling 5–8 features simultaneously, it is easy to lose track of where each one stands. The overview gives you a weekly orientation in seconds — no need to open Jira, Confluence, or Slack to remember what you were doing.

---

## Adding a New Feature

Click the **+** button next to "Features" in the sidebar. Fill in:

- Title, icon, status, customer, due date
- Summary, current focus
- Team members

Custom features can be edited or deleted later. Built-in features (pre-loaded) are read-only in the modal but all their dynamic data is fully editable.

---

## Feature Detail Page

Each feature has a header with an editable **status dropdown** and **due date picker**, then a **Current Focus ribbon** you can update at any time.

Below that are tabs, each covering a different dimension of the feature.

---

## Tabs

### Context

A read-only reference card showing the core feature brief:
- **Summary** — one-paragraph problem statement
- **Key Decisions** — bullet list of confirmed design/product decisions
- **Constraints** — known limitations and out-of-scope items
- **Links** — Jira tickets, PRDs, TDDs, Gong calls, design files
- **Team** — PM, Eng, stakeholders with their roles

**Problem it solves:** Prevents you from having to re-read the PRD or scroll Slack history every time you pick up a feature after a few days away.

---

### Domain Knowledge

A personal, freeform notebook for domain context you have built up over time — things not in the PRD, edge cases, mental models, tax law nuances, integration quirks, etc.

- Click **+ Add** to create a new entry card
- Give it a title and write markdown content
- Entries are collapsible; click the title row to expand/collapse
- Click the **edit icon** to modify content; click **Done** to save
- Title autosaves when you click away
- Click the **delete icon** to remove an entry (with confirmation)

**Problem it solves:** Domain knowledge is usually scattered across Notion, personal notes, and memory. Keeping it here — next to the feature it belongs to — means you can do better call prep, write better design rationale, and onboard teammates faster.

---

### Feature Brief (shown only when available)

Structured background context for features that have rich prior research — architecture decisions, data models, domain deep-dives.

- Click **+ Add** to create a new entry
- Entries are collapsible, editable, and deletable — same pattern as Domain Knowledge
- Pre-loaded entries from the feature definition can also be edited or deleted
- Available for: Avalara Tax, Index Cost, Bulk PO, Pricebook Fee, and other features with background material

---

### Calls

Log and manage all calls related to a feature — customer discovery, internal syncs, design reviews, anything.

#### Creating a call

Click **+ Add** and choose Customer Call or Internal Call. In the modal, set:
- **Call Name** — the primary identifier for this call
- **Call Type** — Customer or Internal
- **Call Status** — Scheduled / Completed / Action Items Pending

#### Call card header

Shows the call type chip, status chip, associated customer, and call name. Status chips use distinct colors:
- Blue = Scheduled
- Green = Completed
- Yellow = Action Items Pending

#### Inside each call — three tabs:

**General Info**
- Call name, associated customer, category, status, date, attendees
- Notes link (URL to Confluence/Notion/Gong)
- **External Resources** — attach slides, docs, recordings; add as many links as needed with a label + URL

**Call Prep**
Structured pre-call preparation template:
- Research Questions — knowledge gaps to fill
- Interviewee Background — who you are talking to and why they were chosen
- Warm-up Questions — rapport-building openers
- Topic Questions — the main interview questions
- Look For / Listen For — signals and patterns to watch for

Use the **Copy prep prompt to Claude.ai** button to instantly generate a clipboard-ready prompt for AI-assisted prep.

**Post Meeting**
- **Transcript** — paste the raw call transcript (Gong, Otter, manual notes)
- **AI Summary** — generate a structured summary from the transcript using Claude

**Problem it solves:** Call prep lives in random docs, transcripts stay in Gong, and action items get lost in Slack. Putting everything under one call card means you can prep, run, and debrief a call without leaving the tool — and your research compounds over time.

---

### Q&A

A structured question bank with tracked answers per feature.

- Built-in questions come from the feature definition (open design questions, unknowns)
- Add your own custom questions with **+ Add**
- Click **Add answer…** under any question to open the answer editor
- Answers support **markdown** — use headers, bullets, bold, tables
- Attach screenshots or URLs to any question for visual evidence
- Mark questions as **Resolved** when answered; filter by open/resolved
- Delete questions you have added yourself

Answers autosave when you click away from the text area.

**Problem it solves:** Design decisions are often driven by answers to specific questions — "Can a customer have multiple Avalara certificates?" — but the answer and the reasoning behind it end up buried in email threads. The Q&A tab keeps the question and its answer permanently linked, traceable, and findable.

---

### Design Spec

Embeds the design spec file directly in the app.

- For features with a pre-loaded spec, the spec displays as an embedded card
- Click the **edit icon** to change the spec URL or content
- Click the **delete icon** to remove the built-in spec (a Restore button appears if you want it back)
- Add additional spec links with **+ Add**

---

### Design Files

Manages links to Figma files, prototypes, or other design assets.
- Add multiple design file links with labels using **+ Add**
- Direct links open in a new tab

---

### Notes

A free-form scratchpad for anything that does not fit elsewhere — raw thoughts, Slack messages to follow up on, reminders. Autosaves as you type.

---

### To Do

A unified task list covering all work states for a feature — what still needs doing, what is finished, and what is on hold.

#### Task statuses

| Status | Icon | Meaning |
|--------|------|---------|
| To Do | Grey circle | Not started |
| Done | Green checkmark | Completed |
| Postponed | Yellow pause | Deferred; stores a reason |

#### Actions per task

- **To Do tasks:** mark done (✓), postpone (⏸), delete (if custom)
- **Done tasks:** undo back to To Do, delete (if custom)
- **Postponed tasks:** undo back to To Do, mark done directly, delete (if custom)

When you postpone a task, an inline field opens for you to record the reason.

#### Adding tasks

Click **+ Add** or press Enter in the input field to add a custom task. Built-in tasks (pre-loaded from the feature definition) can be checked off or postponed but not deleted.

#### Progress bar

The progress bar on Schedule Overview counts `Done / (To Do + Done)`. Postponed tasks are excluded from both numerator and denominator so they do not drag down progress.

**Problem it solves:** Jira tickets track engineering work, not design work. The To Do tab is your personal design backlog — specific enough to act on, always visible alongside the feature context.

---

## Deleted Features

Deleted features are listed in the **Deleted** section at the bottom of the sidebar rather than being permanently removed.

- Click **Restore** to bring a feature back
- Click the **delete forever icon** to permanently remove it — this cannot be undone (confirmation required)

---

## Data & Persistence

Data is stored in two places:

1. **Browser localStorage** — live working state, updates on every keystroke
2. **`index.html` embedded snapshot** — written by the git-sync server every 30 seconds, committed to git

### Autosave

Every field saves automatically:
- Status, due date, current focus — save on change
- Notes — save on every keystroke
- Q&A answers — save when you click away (blur)
- Domain knowledge / Feature Brief title and content — save when you click away
- Call fields — save on change
- Tasks — save immediately on any action

### Backup

Data is backed up automatically via git auto-sync. To restore data on a new machine, `git clone` the repo, run `node server.js`, and open the app — your state loads from the snapshot embedded in `index.html`.

---

## Status Workflow

| Status | Meaning |
|--------|---------|
| Discovery | Researching the problem; no design decisions made yet |
| Design | Actively designing; spec in progress |
| Dev | Handed off to engineering; providing design support |
| QA | In testing; reviewing implementation |
| Done | Shipped or closed |

Change status directly from the dropdown in the feature header. The sidebar badge and Schedule Overview card update immediately.

---

## Tips

- **Start each session:** `node server.js` → open `http://localhost:3456` → check sync indicator turns green
- **Start each week on Schedule Overview** — scan current focus and progress for all features, update anything stale
- **Use Current Focus as a daily intent** — one sentence: what specifically needs to happen today on this feature
- **Log calls even before they happen** — create the call as Scheduled, fill in prep, paste the transcript after
- **Use markdown in Q&A answers** — tables work well for comparing options; headers make long answers scannable
- **Domain Knowledge is for things you learned, not things you were told** — if you had to figure it out, write it down here so you never have to figure it out again
- **Postpone, don't delete** — if a task is blocked, postpone it with a reason rather than deleting so the context is preserved
