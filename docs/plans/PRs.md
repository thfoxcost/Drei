# Pull Requests Feature — UI Build Roadmap

## Data Model

### `pull_requests` table

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `repo_id` | `BIGINT NOT NULL` | FK → `repositories.id` ON DELETE CASCADE |
| `number` | `INTEGER NOT NULL` | Shared sequence with issues: `UNIQUE(repo_id, number)` |
| `title` | `TEXT NOT NULL` | |
| `description` | `TEXT NOT NULL DEFAULT ''` | Markdown body |
| `state` | `TEXT NOT NULL DEFAULT 'open'` | `'open'`, `'closed'`, `'merged'` |
| `author_id` | `TEXT NOT NULL` | References `user.id` |
| `source_branch` | `TEXT NOT NULL` | The branch with the changes |
| `target_branch` | `TEXT NOT NULL` | The branch being merged into (usually `main`) |
| `merge_commit_hash` | `TEXT` | Set on merge, null otherwise |
| `merged_at` | `TIMESTAMPTZ` | |
| `merged_by` | `TEXT` | References `user.id` |
| `closed_at` | `TIMESTAMPTZ` | |
| `closed_by` | `TEXT` | References `user.id` |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

### `pull_request_comments` table

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `pull_request_id` | `BIGINT NOT NULL` | FK → `pull_requests.id` ON DELETE CASCADE |
| `body` | `TEXT NOT NULL` | |
| `created_by` | `TEXT NOT NULL` | References `user.id` |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

### `pull_request_events` table

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `pull_request_id` | `BIGINT NOT NULL` | FK → `pull_requests.id` ON DELETE CASCADE |
| `type` | `TEXT NOT NULL` | `'comment'`, `'state_change'`, `'merged'`, `'review'` |
| `actor_id` | `TEXT NOT NULL` | References `user.id` |
| `metadata` | `JSONB` | Flexible payload (old state, new state, etc.) |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

### PR numbering: shared with issues

Number allocation uses the same pattern as issues — `SELECT MAX(number) FROM issues WHERE repo_id = $1 UNION ALL SELECT MAX(number) FROM pull_requests WHERE repo_id = $1` → take the max of both → `+ 1`, inside a `FOR UPDATE` lock on the repository row. This guarantees issues and PRs never collide.

---

## PR States

```
open  ──→  closed   (author or maintainer closes without merging)
open  ──→  merged   (author or maintainer merges via merge commit)
```

- `open` — PR is active, accepting comments and reviews
- `closed` — PR was closed without merging
- `merged` — PR was merged (sets `merge_commit_hash`, `merged_at`, `merged_by`)

For MVP: no "changes requested" / "approved" review states. That's later.

---

## Git Operations Needed

All of these use go-git, same as existing `gitrepo/` code:

| Operation | Purpose | go-git API |
|---|---|---|
| **List branches** | Branch picker UI (source + target) | `GetBranches()` — already exists |
| **Merge-base** | Find common ancestor between source and target | `git merge-base` via `exec.Command` (no clean go-git equivalent) |
| **Ahead/behind count** | Show "X commits ahead, Y behind target" | Walk commits from merge-base to source, and merge-base to target |
| **Diff stat** | File Changes tab — list of changed files with +/- counts | `object.DiffTree()` between merge-base commit and source HEAD (same as `computeCommitStats`) |
| **Full diff** | File Changes tab — line-level hunks | `computeFileDiffs()` pattern from commits.go, rebased onto merge-base |
| **Merge check** | Can this merge cleanly? (no conflicts) | `git merge-tree` via `exec.Command` (dry run) |
| **Perform merge** | Actually merge source into target | `git merge --no-ff` via `exec.Command` on the bare repo, or open a non-bare clone temporarily |
| **Commit list** | Commits tab — commits in this PR | Walk from merge-base to source HEAD |

**Key insight**: The diff for a PR is `diff(merge-base, source_head)`, not `diff(target_head, source_head)`. This gives you the clean diff of just the PR's changes regardless of what else happened on target.

---

## Backend API Endpoints

### Core PR CRUD

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/api/repos/{owner}/{repo}/pulls` | `PullsHandler` | List PRs with filters (state, author, search, sort) |
| `POST` | `/api/repos/{owner}/{repo}/pulls` | `PullsHandler` | Create PR (title, description, source_branch, target_branch) |
| `GET` | `/api/repos/{owner}/{repo}/pulls/{number}` | `PullHandler` | Get single PR with metadata |
| `PATCH` | `/api/repos/{owner}/{repo}/pulls/{number}` | `PullHandler` | Update title/description |
| `POST` | `/api/repos/{owner}/{repo}/pulls/{number}/close` | `PullStateHandler` | Close PR without merging |
| `POST` | `/api/repos/{owner}/{repo}/pulls/{number}/merge` | `PullMergeHandler` | Merge PR (creates merge commit) |

### Comments

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/api/repos/{owner}/{repo}/pulls/{number}/comments` | `PullCommentsHandler` | List comments |
| `POST` | `/api/repos/{owner}/{repo}/pulls/{number}/comments` | `PullCommentsHandler` | Add comment |
| `PATCH` | `/api/repos/{owner}/{repo}/pulls/{number}/comments/{id}` | `PullCommentHandler` | Edit comment |
| `DELETE` | `/api/repos/{owner}/{repo}/pulls/{number}/comments/{id}` | `PullCommentHandler` | Delete comment |

### Git data for PR tabs

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/api/repos/{owner}/{repo}/pulls/{number}/commits` | `PullCommitsHandler` | List commits in PR |
| `GET` | `/api/repos/{owner}/{repo}/pulls/{number}/files` | `PullFilesHandler` | Diff stat + file list |
| `GET` | `/api/repos/{owner}/{repo}/pulls/{number}/diff` | `PullDiffHandler` | Full unified diff |
| `GET` | `/api/repos/{owner}/{repo}/pulls/check?source=&target=` | `PullCheckHandler` | Ahead/behind count, merge-base, conflict check |

### Activity/events (for conversation tab)

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/api/repos/{owner}/{repo}/pulls/{number}/events` | `PullEventsHandler` | Activity timeline (state changes, comments, merge) |

---

## Frontend Pieces

### Types (`client/src/types/pulls.ts`)

```typescript
PullRequest       // id, number, title, description, state, author, sourceBranch, targetBranch, ...
PullRequestsList  // pulls[], open, closed, merged, total
PullRequestComment
PullRequestEvent
PullRequestFile   // path, action, additions, deletions
PullDiff          // files[], diff (unified text)
PullFilters       // state, author, search, sort
```

### Hooks (`client/src/hooks/`)

| Hook | Purpose |
|---|---|
| `usePulls.ts` | List PRs with filters (mirrors `useIssues`) |
| `usePull.ts` | Single PR data |
| `usePullCommits.ts` | Commits tab data |
| `usePullFiles.ts` | File changes tab data |
| `usePullDiff.ts` | Full diff for a PR |

### Components (`client/src/components/repo/pulls/`)

| Component | Purpose |
|---|---|
| `pull-list.tsx` | PR list page with open/closed/merged tabs, search, filters |
| `pull-item.tsx` | Single PR row in the list (title, #number, author, status badge) |
| `pull-detail.tsx` | PR detail page with 3 tab sections |
| `pull-conversation.tsx` | Conversation tab: description, comments, activity events |
| `pull-commits.tsx` | Commits tab: list of commits in the PR |
| `pull-files.tsx` | File Changes tab: diff viewer, file tree, additions/deletions |
| `new-pull.tsx` | Create PR form: branch pickers, title, description |
| `pull-merge-button.tsx` | Merge button with confirmation |

### Routes (`client/src/routes/$username/$repo/pulls/`)

| Route file | Maps to |
|---|---|
| `route.tsx` | Layout wrapper (like issues `route.tsx`) |
| `index.tsx` | `<PullList />` |
| `new.tsx` | `<NewPull />` |
| `$pull.tsx` | `<PullDetail />` |

### Existing files to modify

| File | Change |
|---|---|
| `repo-tabs.tsx` | Enable Pull Requests tab, link to `/pulls` |
| `main.go` | Register all new pull request routes |
| `migrate.go` | Add `pull_requests`, `pull_request_comments`, `pull_request_events` tables |

---

## UI Build Order

### 1. New/Create PR Page

Build this first. It's the entry point and simplest screen.

**What it needs:**
- Title input (required)
- Description textarea (markdown supported)
- Source branch dropdown (list branches in the repo, excluding the target)
- Target branch dropdown (defaults to repo's default branch)
- "Create pull request" button (disabled until title + both branches selected)
- Validation: source branch must be different from target, source must exist, title must not be empty

**Show while loading:**
- Branch lists loading spinner

**Empty/error state:**
- If no branches exist or only one branch: message saying "You need at least two branches to create a pull request"

---

### 2. PR List Page

Build this second. It's what users land on from the tab.

**What it needs:**
- Three tabs: `Open`, `Closed`, `Merged` with count badges
- Search bar (filters by title)
- List of PRs, each showing:
  - `#number` + title
  - Status badge (open/closed/merged with color)
  - Author avatar + username
  - Source → target branch labels
  - Created time (relative: "2 hours ago")
  - Comment count
- Sort dropdown: newest, oldest, most-commented
- "New pull request" button linking to create page

**Empty states:**
- Open tab empty: "No open pull requests"
- Closed tab empty: "No closed pull requests"
- Merged tab empty: "No merged pull requests"
- Search returns nothing: "No pull requests match your search"

---

### 3. PR Detail Page (shell + tabs)

Build this third. It's the container that holds everything else.

**What it needs:**
- PR header: `#number` + title, status badge, source → target branch
- Author info + created time
- Tab bar with three tabs: `Conversation`, `Commits`, `Files Changed`
- Tab counts (commit count, file count, comment count)
- Default tab: Conversation

**This is just the layout shell.** The tabs below are separate components.

---

### 4. Conversation Tab

Build this inside the detail page. This is the main activity view.

**What it needs:**
- Original PR description (rendered markdown)
- Comment form (textarea + submit button)
- Comment list (avatar, username, timestamp, markdown body)
- Activity events inline in the timeline:
  - "X opened this pull request"
  - "X closed this pull request"
  - "X merged this pull request"
  - "X commented"
- Each event has an icon/avatar and timestamp

**Empty state:**
- No comments yet: show description only, no placeholder

---

### 5. Commits Tab

Build this fourth. Straightforward list.

**What it needs:**
- List of commits in the PR
- Each commit shows:
  - Short hash (7 chars, monospace)
  - Commit message (first line)
  - Author avatar + username
  - Date (relative)

**Empty state:**
- "No commits" (shouldn't happen but handle it)

---

### 6. File Changes/Diff Tab

Build this fifth. Most complex tab.

**What it needs:**
- Summary bar: `X files changed, Y additions, Z deletions`
- File tree/list with expandable diffs
- Each file shows:
  - Filename + action badge (added/modified/deleted with color)
  - Addition/deletion counts (+N / -N)
  - Collapsible by default (click to expand)
- Expanded view shows unified diff:
  - Green lines for additions
  - Red lines for deletions
  - Gray lines for context
  - Line numbers on both sides
  - Hunk headers (`@@ -x,y +x,y @@`)

**Empty state:**
- "No file changes" (shouldn't happen but handle it)

---

### 7. Merge Button / Merge UI

Build this last. It goes in the PR detail header area.

**What it needs:**
- "Merge pull request" button (only visible if PR is open and user has permission)
- Click opens confirmation modal:
  - Shows source → target branch
  - Shows "This will create a merge commit"
  - Confirm / Cancel buttons
- After merge: button changes to "Merged" (disabled, with merge commit hash link)
- If PR is closed: show "Closed" badge, no merge button
- Disable merge if there are conflicts (show "Cannot be merged — conflicts detected" message)

**States:**
- Ready to merge: green button
- Merging in progress: spinner on button
- Already merged: gray "Merged" badge
- Conflicts: red warning + disabled button

---

### 8. Empty / Loading / Error States (global)

Apply these across all screens:

| State | What to show |
|---|---|
| **Loading** | Skeleton loaders or spinners. List pages: skeleton rows. Detail page: skeleton tabs + content. |
| **Error (network)** | "Something went wrong" with retry button |
| **Error (404)** | "Pull request not found" or "Repository not found" |
| **Empty list** | Context-specific message (see each screen above) |
| **No permission** | Hide merge button, hide comment form, show read-only view |

---

## Summary — Build Sequence

```
[X] A New PR indicator -> item + button from shadnc (i added this manaully)
1. New PR page        → branch picker + form
[X] PR list page       → tabs + search + list
[X] PR detail shell    → header + tab bar
[x] Conversation tab   → description + comments + events
[X] Commits tab        → commit list
[X] File Changes tab   → diff viewer
[X] Merge button       → merge flow
[x] Empty/loading/error → polish across all screens
```
