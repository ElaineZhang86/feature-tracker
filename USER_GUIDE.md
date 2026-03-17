# Feature Hub User Guide

**Feature Hub** is a personal workspace for product designers to track every in-flight feature in one place. It replaces scattered Confluence notes, Slack threads, and browser bookmarks with a single file that keeps context, research, calls, and tasks together, organized per feature, always accessible offline.

---

## Setup

### 1. Open the app

Open `index.html` directly in your browser, or visit the hosted GitHub Pages URL if available.

### 2. Enter your name and role

On first launch, a two-step welcome modal appears:

- **Step 1:** enter your name and role
- **Step 2:** optionally connect GitHub Sync (recommended) so your data is backed up automatically

You can skip Step 2 and set up GitHub Sync later in **Settings → GitHub Sync**.

### 3. Connect Confluence *(optional)*

To use the PRD tab (importing, editing, and pushing pages), you need to save your Confluence credentials once in **Settings → Integrations**.

**What you need:**
- Your Atlassian domain (e.g. `yourcompany.atlassian.net`)
- The email address you use to log in to Confluence
- An Atlassian API token

**Create an API token:**
1. Go to [id.atlassian.com](https://id.atlassian.com) → **Manage account → Security → API tokens**
2. Click **Create API token**, give it a name (e.g. *feature-hub*), and copy it

**Connect in the app:**
1. Click the **⚙ icon** in the sidebar footer to open Settings
2. Go to **Integrations**
3. Fill in your domain, email, and API token
4. Click **Connect**. The section shows a connected status.

Credentials are stored in your browser only and are only sent to the Confluence API when you fetch or push a page.

---

## How Data is Saved

Your browser's **localStorage** is always the live working copy. Every edit lands there instantly with no save button needed.

For backup and cross-machine access, the app supports two optional methods:

### GitHub Sync (recommended)

Connect a GitHub repo in **Settings → GitHub Sync**. Once connected:
- The app automatically saves snapshots of your workspace to a `data.json` file in your repo
- On a new machine, reconnect with the same settings and the app restores the latest snapshot from GitHub into localStorage
- Your data can be restored from GitHub even if you clear your browser

See [GitHub Sync Setup](#github-sync-setup) for instructions.

### Data File

Connect a local JSON file in **Settings → Data File**. Once connected:
- The app automatically writes updated snapshots to the connected file
- Put the file in iCloud Drive or Dropbox for a passive second copy
- Works offline (no internet required)

---

## GitHub Sync Setup

> ⚠️ **Don't connect to the public `feature-hub` repo.** Your workspace data would be visible to anyone who clones it. Instead, create a private repo of your own (e.g. `feature-hub-data`) and connect to that.

**What you need:** A GitHub account (you already have one if you cloned the repo).

**1. Create a Personal Access Token**

Go to [github.com](https://github.com) → **Settings → Developer settings → Personal access tokens → Fine-grained tokens** → Generate new token.

- Set **Repository access** to your `feature-hub` repo
- Under **Permissions → Repository permissions**, set **Contents** to **Read and Write**
- Copy the token (starts with `github_pat_` or `ghp_`)

**2. Connect in the app**

Open **Settings → GitHub Sync** and fill in:

| Field | Value |
|-------|-------|
| Owner | Your GitHub username |
| Repository | `feature-hub` |
| Branch | Your working branch (e.g. `main`) |
| Token | Paste your token |
| File path | `data.json` (default) |

Click **Connect**. The app verifies access and writes an initial snapshot to GitHub immediately.

**3. Done**

The sidebar footer shows a green dot and the time of the last successful save. From this point on, the app automatically saves snapshots in the background.

---

## Common Questions

**Does the app need internet to work?**
No. The app runs entirely in your browser. Internet is only required for GitHub Sync to push and pull data.

---

**Where is my data stored?**
localStorage is always the live working copy. Every edit lands there instantly. If GitHub Sync is configured, the app automatically saves snapshots to your GitHub repo. If a Data File is connected, updated snapshots are written there too.

---

**Do I need to create a git branch?**
If you are just using the tool (adding tasks, notes, calls, domain knowledge), no branch needed.

If you want to experiment with modifying the app itself, create a branch so you can test without affecting the working version.

---

**Will my changes affect the original repo?**
No. Any changes you make only affect your local copy unless you explicitly push them.

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
| Green | Saved (shows last save time) |
| Red | Save failed |

The theme toggle (sun/moon) is in the sidebar header, next to the app title.

---

## Your Identity

On first launch, a welcome modal asks for your name and role. These appear in the sidebar header so you always know whose workspace this is.

- **Edit at any time:** click your name in the sidebar, or go to **Settings → Account**
- Name is required; role is optional

---

## Settings

Click the **⚙ icon** in the sidebar footer to open Settings.

| Section | What you can do |
|---------|----------------|
| Account | Update your name and role |
| Help | Open the User Guide |
| GitHub Sync | Connect a GitHub repo to back up your data automatically on every change |
| Data File | Auto-save to a local JSON file, or restore your full workspace from a backup |
| Integrations | Enter your Confluence domain, email, and API token so the PRD import and push flows can authenticate |
| Appearance | Toggle light / dark theme |

### GitHub Sync

Fill in Owner, Repository, Branch, File path, and Personal Access Token. The **Connect** button is disabled until Owner, Repository, and Token are all filled. Click **Connect**. The app immediately loads your saved data from GitHub and merges it into your workspace.

#### Status indicators

The sync status appears both in the sidebar footer and in the Settings panel:

| Status | Dot | Label |
|--------|-----|-------|
| Loading data from GitHub on connect | Blue (pulsing) | Loading from GitHub… |
| Saving a change | Blue (pulsing) | Saving to GitHub… |
| Last save succeeded | Green | GitHub saved HH:MM |
| Save failed | Red | GitHub sync failed: \<reason\> |
| Connected but idle | (none) | GitHub sync idle |
| Not connected | (none) | Not connected |

#### Disconnecting

Click **Disconnect** (top-right of the GitHub Sync section). A confirmation modal appears. Your data on GitHub is not deleted and your local data is not affected. After confirming, the fields are repopulated with your previous values so you can reconnect without retyping them.

### Data File

| Button | What it does |
|--------|-------------|
| **Connect file** | Browser prompts you to pick a save location. The app automatically writes updated snapshots to that file. Once connected the button becomes **Download**. |
| **Download** | Downloads the current workspace as `feature-hub-data.json` to your Downloads folder. |
| **Load from backup** | Pick any `.json` backup file to restore your full workspace. Replaces everything in your current session. |

When a file is connected, the status row shows the filename and file size.

### Integrations

Enter your Confluence credentials so the PRD import and push flows can authenticate:

| Field | What to enter |
|-------|--------------|
| Confluence Domain | Your Atlassian domain, e.g. `yourcompany.atlassian.net` |
| Email | The email address you use to log in to Confluence |
| API Token | An Atlassian API token. Click **Get token ↗** in Settings to create one. |

Fill in all three fields and click **Connect**. The section collapses and shows a connected status. Credentials are stored locally in your browser. They are never sent anywhere except the Confluence API when you fetch or push a page.

To update credentials, click **Disconnect**, edit the fields, and click **Connect** again.

---

## Schedule Overview

The landing page. Shows every feature at a glance. Switch between three views using the toggle in the top-right:

| View | Description |
|------|-------------|
| Cards | Grid of cards, each showing status, customer, and progress |
| List | Table layout with columns: Feature, Status, Customer, Due Date, Progress |
| Timeline | Kanban board grouped by status |

Each card or row shows:

- **Status badge:** Discovery, Design, Dev, QA, Done
- **Customer** and **due date**
- **Progress bar:** percentage of To Do tasks marked Done (postponed tasks excluded)

Click any card to jump to that feature's detail page.

**Drag to reorder:** drag any card or list row to rearrange the feature order. The order is saved automatically and persists across sessions.

---

## Adding a New Feature

Click the **+** button next to "Features" in the sidebar. Fill in:

- Title, icon, status, customer, due date
- Summary
- Team members

To add a feature from a file exported by someone else, click the **upload icon** next to the + button and select a `.json` export file.

---

## Exporting and Importing Features

Features can be exported as self-contained JSON files and imported into any other Feature Hub instance, useful for sharing context with teammates or backing up individual features.

### Export

Open a feature and click the **download icon** (↓) in the top-right of the feature header. A file named `feature-<title>.json` is saved to your downloads folder.

### Import

Click the **upload icon** (↑) next to the "Features" label in the sidebar. Select a `.json` export file. The feature is added to your workspace with a new ID. Your existing features are not affected.

> Exported files contain the full feature definition and all associated state: tasks, calls, Q&A, notes, domain knowledge, and design files.

---

## Feature Detail Page

Each feature has a sticky header bar showing the title, editable **status dropdown**, **due date picker**, and action buttons. Below the header is the tab row. Both stay visible as you scroll through long content.

Below the sticky header are tabs, each covering a different dimension of the feature.

---

## Tabs

### Context

A reference card showing the core feature brief:
- **Summary:** one-paragraph problem statement
- **Key Decisions:** confirmed design/product decisions
- **Constraints:** known limitations and out-of-scope items
- **Links:** Jira tickets, PRDs, Gong calls, design files
- **Team:** PM, Eng, stakeholders with their roles

---

### Domain Knowledge

A personal notebook for context you have built up over time: edge cases, mental models, integration quirks, anything not in the PRD.

- Click **+ Add** to create a new entry
- Entries are collapsible, editable, and deletable
- Title autosaves when you click away

---

### Feature Brief

Structured background context: architecture decisions, data models, domain deep-dives.

- Click **+ Add** to create a new entry
- Same collapsible/editable/deletable pattern as Domain Knowledge

---

### PRD

A live view of your Confluence PRD, pulled directly into Feature Hub. It stays isolated from your other tabs. Syncs and edits here never touch your Notes, Q&A, or To Do.

#### Connecting a PRD

Click the **cloud download icon** (↓☁) in the feature header, or the **Import from Confluence** button on the empty PRD tab. The import modal walks you through two steps:

1. **Fetch page:** paste your Confluence page URL and click **Fetch**. The app resolves the page ID automatically, including short URLs and redirects.
2. **Preview & import:** review the page title and content, then click **Import**. The PRD is saved to the feature and displayed immediately.

#### PRD header bar

Once a PRD is connected, a header bar appears at the top of the PRD tab (inside the sticky header when you scroll):

| Button | What it does |
|--------|-------------|
| **Push** | Publishes your edited PRD content back to Confluence, replacing the page |
| **Edit** | Opens the PRD in the rich-text editor |
| **↓☁ (cloud download)** | Re-imports the latest version from Confluence, replacing local content |

The header also shows the connection status dot and the date/time of the last sync.

| Dot color | Meaning |
|-----------|---------|
| Green | Connected (page ID is stored) |
| Gray | Disconnected (no page linked) |

#### Editing the PRD

Click **Edit** to enter edit mode. A rich-text toolbar appears in the sticky header with:

- **Paragraph styles:** Normal, Heading 1, Heading 2, Heading 3, Blockquote, Code block
- **Inline formatting:** Bold, Italic, Underline, Strikethrough, Inline code
- **Lists:** Bullet list, Numbered list
- **Insert:** Link, Horizontal rule
- **History:** Undo, Redo

Content autosaves to localStorage as you type. No data is lost if you refresh. Click **Save** to commit the edit, or **Cancel** to discard changes.

#### Pushing back to Confluence

Click **Push** to publish your edited content back to Confluence. The server always fetches the latest page version before writing, so stale-version conflicts are avoided automatically.

---

### Calls

Log all calls related to a feature: customer discovery, internal syncs, design reviews.

#### Creating a call

Click **+ Add** and choose **Customer Call** or **Internal Call**. The call opens immediately in edit mode. No modal or popup. Fill in the fields directly:

- **Call Name:** primary identifier
- **Type:** Customer or Internal
- **Category:** Customer Discovery, Design Review, Internal Sync, etc.
- **Status:** Scheduled, Completed, or Action Items Pending
- **Date**, **Customer**, **Attendees**, **Notes Link**
- **External Resources:** attach slides, recordings, or docs with a label and URL

Click the **edit icon** (pencil) on any existing call card to switch it to edit mode. When editing, click **Save** to confirm your changes or **Discard** to revert them. Discarding a brand new call removes it entirely.

#### Call status chips

| Status | Color |
|--------|-------|
| Scheduled | Blue |
| Completed | Green |
| Action Items Pending | Yellow |

#### Three tabs inside each call

**General Info:** call details, attendees, resources

**Call Prep:** structured pre-call preparation:
- Research Questions, Interviewee Background, Warm-up Questions, Topic Questions, Look For / Listen For
- Use **Copy prep prompt to Claude.ai** to generate AI-assisted prep

**Post Meeting:** paste the transcript; generate an AI summary with Claude

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
| Postponed | Deferred (stores a reason) |

- Add tasks with **+ Task**
- **Edit a task:** click the task text to edit it inline; press Enter or Escape to save, or click away
- Postpone a task to record why it is blocked
- Progress bar on Schedule Overview counts Done / (To Do + Done); postponed tasks excluded

#### Sections

Group tasks with section headers to organize your list.

- Click **+ Section** to add a new section header
- **Rename a section:** click the section title to edit it inline
- **Delete a section:** click the trash icon on the section header (tasks inside are not deleted)
- **Drag to reorder:** drag any task above or below another task, or drop it onto a section header to place it directly below that section

---

## Getting Updates

If you cloned the repo, you can pull in the latest version of the app at any time:

1. Open your terminal and navigate to the `feature-hub` folder
2. Run `git pull`
3. Refresh the page in your browser

Your data is stored in localStorage and is not affected by pulling updates. If GitHub Sync or a Data File is connected, your snapshots are also unaffected.

---

## Deleted Features

Deleted features appear in the **Deleted** section at the bottom of the sidebar.

- **Restore:** brings the feature back
- **Delete forever:** permanent removal (requires confirmation)

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

- **Set up GitHub Sync:** connect once and your workspace is backed up automatically from then on
- **Connect the PRD early:** import the Confluence page as soon as the PRD exists; having it inline saves constant tab-switching during design
- **Edit in Feature Hub, push to Confluence:** use the rich-text editor to keep your PRD up to date, then Push to publish; no need to open Confluence separately
- **Re-import after stakeholder edits:** if the PM or engineer updates the Confluence page, hit the cloud download icon to pull in the latest before your next edit
- **Log calls even before they happen:** create the call as Scheduled, fill in prep, paste the transcript after
- **Domain Knowledge is for things you learned, not things you were told:** if you had to figure it out, write it down so you never have to again
- **Postpone, don't delete:** if a task is blocked, postpone it with a reason so the context is preserved
- **Export before you hand off:** share a feature's full context with a teammate as a single file
