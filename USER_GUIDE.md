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
```

**3. Open the app**

Open **http://localhost:3456** in your browser. Keep the terminal open while you work.

### Daily workflow

1. Open Terminal, `cd` into the `feature-tracker` folder
2. Run `node server.js`
3. Open **http://localhost:3456** in your browser
4. Work normally — all changes save automatically

### Restoring on a new machine

```bash
git clone https://github.com/YOUR_USERNAME/feature-tracker.git
cd feature-tracker
node server.js
```

Open `http://localhost:3456`. If you have GitHub Sync configured, your data loads automatically from GitHub. Otherwise it loads from the snapshot in `index.html`.

### Getting updates

```bash
git pull
node server.js
```

Your data is not affected — the pull only updates the app code.

**In-app update notification:** When an update is available, a banner automatically appears at the top of the app (above Schedule Overview):

> ⬆ **App update available** — run `git pull` in your terminal, then restart `node server.js` to get the latest version.

---

## How Data is Saved

Every field saves automatically to your browser's **localStorage** the moment you make a change — no save button needed.

For backup and cross-machine access, the app supports two optional sync methods:

### GitHub Sync (recommended)

Connect a GitHub repo in **Settings → GitHub Sync**. Once connected:
- Every change auto-saves to a `data.json` file in your repo within 1 second
- On any machine, open the app and enter your token once — your data loads automatically from GitHub
- Works even if you clear your browser data

See [GitHub Sync Setup](#github-sync-setup) for instructions.

### Data File

Connect a local JSON file in **Settings → Data File**. Once connected:
- Every change auto-saves to the file within 1 second
- Put the file in iCloud Drive or Dropbox for cross-machine access
- Works offline — no internet required

---

## GitHub Sync Setup

**What you need:** A GitHub account (you already have one if you cloned the repo).

**1. Create a Personal Access Token**

Go to [github.com](https://github.com) → **Settings → Developer settings → Personal access tokens → Fine-grained tokens** → Generate new token.

- Set **Repository access** to your `feature-tracker` repo
- Under **Permissions → Repository permissions**, set **Contents** to **Read and Write**
- Copy the token (starts with `github_pat_` or `ghp_`)

**2. Connect in the app**

Open **Settings → GitHub Sync** and fill in:

| Field | Value |
|-------|-------|
| Owner | Your GitHub username |
| Repository | `feature-tracker` |
| Branch | Your working branch (e.g. `main`) |
| Token | Paste your token |
| File path | `data.json` (default) |

Click **Connect**. The app tests the connection and saves your current state to GitHub immediately.

**3. Done**

The sidebar footer shows a green dot and "GitHub saved HH:MM" after each successful save. From this point on, every change syncs automatically — no action required.

---

## Common Questions

**Does the app need internet to work?**
No. The app runs entirely on your local machine. Internet is only required if you are using GitHub Sync.

---

**What is the terminal doing? Can I use other terminals while it's open?**
The terminal is just running the local server. As long as `node server.js` is running somewhere, the app works. You can freely use other terminals or work in other directories — that one just needs to stay open so the server keeps running.

---

**Where is my data stored?**
All changes save instantly to your browser's localStorage. If you have GitHub Sync configured, a backup also saves to `data.json` in your GitHub repo within 1 second of each change. If you have a Data File connected, it saves there too.

---

**Do I need to create a git branch?**
If you are just using the tool — adding tasks, notes, calls, domain knowledge — you can stay on `main`. No branch needed.

If you want to experiment with changing the app itself (modifying the UI, adding functionality), create your own branch so you can test things without affecting the working version.

---

**Will my changes affect the original repo?**
No. Since you cloned it, any changes you make only affect your local copy. The original repo would only change if someone pushed changes back to GitHub, which requires permissions.

---

## Navigation

The left sidebar lists every feature with its current status badge. Click any feature to open it. At the top is **Schedule Overview**, a dashboard showing all features at once.

### Sidebar header

Your name and role appear below the app title. Click them to edit. On first launch you will be prompted to enter them.

### Sidebar footer

The footer shows your GitHub sync status on the left and the **⚙ settings** button on the right.

| Dot color | Meaning |
|-----------|---------|
| Blue (pulsing) | Saving to GitHub |
| Green | Saved — shows last save time |
| Red | Save failed |

The theme toggle (sun/moon) is in the sidebar header, next to the app title.

---

## Your Identity

On first launch, a welcome modal asks for your name and role. These appear in the sidebar header so you always know whose workspace this is.

- **Edit at any time** — click your name in the sidebar, or go to **Settings → Account**
- Name is required; role is optional

---

## Settings

Click the **⚙ icon** in the sidebar footer to open Settings.

| Section | What you can do |
|---------|----------------|
| Account | Update your name and role |
| Data File | Connect a local JSON file for automatic backup |
| GitHub Sync | Connect a GitHub repo for automatic cloud backup |
| Help | Open the User Guide |
| Appearance | Toggle light / dark theme |

---

## Schedule Overview

The landing page. Shows every feature at a glance. Switch between three views using the toggle in the top-right:

| View | Description |
|------|-------------|
| Cards | Grid of cards, each showing status, customer, current focus, and progress |
| List | Table layout with columns: Feature, Status, Customer, Due Date, Progress |
| Timeline | Kanban board grouped by status |

Each card or row shows:

- **Status badge** (Discovery / Design / Dev / QA / Done)
- **Customer** and **due date**
- **Current Focus** — what you are actively working on right now
- **Progress bar** — percentage of To Do tasks marked Done (postponed tasks excluded)

Click any card to jump to that feature's detail page.

**Drag to reorder** — drag any card or list row to rearrange the feature order. The order is saved automatically and persists across sessions.

---

## Adding a New Feature

Click the **+** button next to "Features" in the sidebar. Fill in:

- Title, icon, status, customer, due date
- Summary, current focus
- Team members

To add a feature from a file exported by someone else, click the **upload icon** next to the + button and select a `.json` export file.

---

## Exporting and Importing Features

Features can be exported as self-contained JSON files and imported into any other Feature Hub instance — useful for sharing context with teammates or backing up individual features.

### Export

Open a feature and click the **download icon** (↓) in the top-right of the feature header. A file named `feature-<title>.json` is saved to your downloads folder.

### Import

Click the **upload icon** (↑) next to the "Features" label in the sidebar. Select a `.json` export file. The feature is added to your workspace with a new ID — your existing features are not affected.

> Exported files contain the full feature definition and all associated state: tasks, calls, Q&A, notes, domain knowledge, and design files.

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

Click the **edit icon** (pencil) on any existing call card to switch it to edit mode. When editing, click **Save** to confirm your changes or **Discard** to revert them. Discarding a brand new call removes it entirely.

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

- **Set up GitHub Sync** — connect once and never worry about data loss again
- **Use Current Focus as a daily intent** — one sentence: what specifically needs to happen today on this feature
- **Log calls even before they happen** — create the call as Scheduled, fill in prep, paste the transcript after
- **Domain Knowledge is for things you learned, not things you were told** — if you had to figure it out, write it down so you never have to again
- **Postpone, don't delete** — if a task is blocked, postpone it with a reason so the context is preserved
- **Export before you hand off** — share a feature's full context with a teammate as a single file
