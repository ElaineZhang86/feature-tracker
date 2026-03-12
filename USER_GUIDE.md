# Feature Context Hub — User Guide

**Feature Context Hub** is a personal workspace for product designers to track every in-flight feature in one place. It replaces scattered Confluence notes, Slack threads, and browser bookmarks with a single file that keeps context, research, calls, and tasks together — organized per feature, always accessible offline.

---

## Navigation

The left sidebar lists every feature with its current status badge. Click any feature to open it. At the top is **Schedule Overview**, a dashboard that shows all features at once.

### Sidebar footer icons
| Icon | Action |
|------|--------|
| Download | Export all data as a JSON backup file |
| Upload | Import a previously exported backup (replaces current data) |
| Sun/Moon | Toggle light / dark theme |

---

## Schedule Overview

The landing page. Shows every feature as a card with:

- **Status badge** (Discovery / Design / Dev / QA / Done)
- **Customer** and **due date**
- **Current Focus** — what you are actively working on right now
- **Progress bar** — percentage of Next Tasks checked off

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

- Click **+ Add Entry** to create a new card
- Give it a title and write markdown content
- Entries are collapsible; click the title row to expand/collapse
- Click **Edit** to modify content; click **Done** to save
- Title autosaves when you click away

**Problem it solves:** Domain knowledge is usually scattered across Notion, personal notes, and memory. Keeping it here — next to the feature it belongs to — means you can do a better call prep, write better design rationale, and onboard teammates faster.

---

### Feature Brief (shown only when available)
A longer, structured technical document embedded directly in the app. Covers domain deep-dives, architecture decisions, data models, and background research. Read-only. Available for Avalara Tax, Index Cost, Bulk PO, Pricebook Fee, and other features with rich background material.

---

### Calls
Log and manage all calls related to a feature — customer discovery, internal syncs, design reviews, anything.

#### Creating a call
Click **+ Add Call** (Customer Call or Internal Call). In the modal, set:
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
- Add your own custom questions with **+ Add Question**
- Click **Add answer…** under any question to open the answer editor
- Answers support **markdown** — use headers, bullets, bold, tables
- Attach screenshots or URLs to any question for visual evidence
- Mark questions as **Resolved** when answered; filter by open/resolved
- Delete questions you have added yourself

Answers autosave when you click away from the text area.

**Problem it solves:** Design decisions are often driven by answers to specific questions — "Can a customer have multiple Avalara certificates?" — but the answer and the reasoning behind it end up buried in email threads. The Q&A tab keeps the question and its answer permanently linked, traceable, and findable.

---

### Design Spec
Embeds the design spec file (HTML or iframe) directly in the app. Available for features with an attached design spec.

---

### Design Files
Manages links to Figma files, prototypes, or other design assets.
- Add multiple design file links with labels
- Direct links open in a new tab

---

### Notes
A free-form scratchpad for anything that does not fit elsewhere — raw thoughts, Slack messages to follow up on, reminders. Autosaves as you type.

---

### Next Tasks
A checklist of design and decision tasks still to complete.

- Pre-loaded tasks come from the feature definition
- Add your own with the **+ Add Task** button or by pressing Enter in the input field
- Check off tasks as you complete them — the progress bar on Schedule Overview updates instantly
- Custom tasks can be deleted; built-in tasks can be checked off but not deleted

**Problem it solves:** Jira tickets track engineering work, not design work. The tasks tab is your personal design backlog — specific enough to act on, always visible alongside the feature context.

---

### Completed
A running log of work already done.

- Pre-loaded entries from the feature definition
- Add your own milestones (discovery calls finished, specs shared, alignment reached)
- Provides a quick history of what has already been decided or built

---

## Data & Persistence

All data is stored in your browser's **localStorage**. Nothing is sent to a server.

### Autosave
Every field saves automatically:
- Status, due date, current focus — save on change
- Notes — save on every keystroke
- Q&A answers — save when you click away (blur) and when you click Save
- Domain knowledge title and content — save when you click away
- Call fields — save on change

### Export / Import (backup)
Use the **download icon** in the sidebar footer to export all data as a timestamped JSON file (e.g. `feature-hub-backup-2026-03-12.json`). Keep this file somewhere safe (Google Drive, Desktop).

Use the **upload icon** to restore from a backup. You will be asked to confirm before data is replaced.

**Recommendation:** Export after any significant session — after logging a call, answering several questions, or adding domain knowledge entries. localStorage can be cleared by browser updates, Chrome profile resets, or private browsing sessions.

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

- **Start each week on Schedule Overview** — scan current focus and progress for all features, update anything stale
- **Use Current Focus as a daily intent** — one sentence: what specifically needs to happen today on this feature
- **Log calls even before they happen** — create the call as Scheduled, fill in prep, paste the transcript after
- **Export before major Chrome updates or switching machines**
- **Use markdown in Q&A answers** — tables work well for comparing options; headers make long answers scannable
- **Domain Knowledge is for things you learned, not things you were told** — if you had to figure it out, write it down here so you never have to figure it out again
