# git-prodman: Git-Native Product Management

> **Vision**: A product/project management system where the Git repository IS the database — no sync, no drift, no lost context.

---

## Core Principles

| Principle | What It Means |
|-----------|---------------|
| **Async-First** | Git's model is async. No real-time multiplayer. Commit → Push → Pull. |
| **Local-Only** | Your data never leaves your machine. No cloud, no telemetry, no accounts. |
| **MIT Licensed** | 100% open source. Fork it, modify it, sell it. No "open core" tricks. |
| **AI-Optional** | Works without AI. Bring your own API key, or use local Ollama. |

---

## The Problem

### Context Fragmentation is Killing Teams

| Tool | Purpose | Reality |
|------|---------|---------|
| Jira/Linear | Issue tracking | Disconnected from actual code state |
| Notion/Confluence | Documentation | Specs drift from implementation |
| Slack/Teams | Communication | Decisions lost in chat history |
| Spreadsheets | Status tracking | Manual updates, always stale |
| Figma | Design | Links break, versions mismatch |

**The result:**
- 23% of work week lost to context switching
- PRDs become fiction within days of writing
- "What was decided?" becomes archaeology
- AI assistants hallucinate without real context
- Onboarding takes weeks, not hours

---

## The Solution: git-prodman

### Core Principle

```
The repository is not connected to the project management system.
The repository IS the project management system.
```

### How It Works

```
your-repo/
├── .prodman/
│   ├── product.yaml          # Product vision, strategy, OKRs
│   ├── roadmap.yaml          # Quarters, milestones, releases
│   ├── epics/
│   │   ├── user-auth.yaml    # Epic definition
│   │   └── payments.yaml
│   ├── specs/
│   │   ├── user-auth.md      # Living PRD (auto-linked to code)
│   │   └── payments.md
│   ├── decisions/
│   │   ├── 001-db-choice.md  # ADRs with context
│   │   └── 002-api-style.md
│   └── feedback/
│       └── customer-insights.yaml
├── src/                      # Your actual code
├── issues/                   # Optional: issues as files
│   ├── open/
│   │   └── 42-fix-login.md
│   └── closed/
└── README.md
```

---

## Key Features

### 1. Everything-as-Code

**Product Vision** (`product.yaml`)
```yaml
name: "Acme Platform"
vision: "Make B2B payments instant and invisible"
okrs:
  - objective: "Achieve product-market fit"
    key_results:
      - metric: "weekly_active_users"
        target: 1000
        current: 342  # Updated by CI/CD
      - metric: "nps_score"
        target: 50
        current: 38
```

**Epics** (`epics/user-auth.yaml`)
```yaml
id: EP-001
title: "User Authentication"
status: in_progress
owner: "@alice"
spec: "../specs/user-auth.md"
issues:
  - "#42"  # GitHub issue reference
  - "#43"
  - "#44"
dependencies:
  - EP-002  # Depends on another epic
acceptance_criteria:
  - "Users can sign up with email"
  - "OAuth with Google/GitHub"
  - "2FA support"
```

**Specs as Living Documents**
```markdown
# User Authentication Spec

## Status
<!-- AUTO-UPDATED -->
- Implementation: 67% complete
- Last commit: abc123 (2 hours ago)
- Open issues: 3
- Tests passing: 42/48

## Overview
[Your PRD content here]

## Implementation Mapping
<!-- AUTO-GENERATED from code annotations -->
| Requirement | Code Location | Status |
|-------------|---------------|--------|
| Email signup | `src/auth/signup.ts` | ✅ Done |
| OAuth Google | `src/auth/oauth.ts` | 🚧 In Progress |
| 2FA | - | ❌ Not Started |
```

---

### 2. AI-Native Workflows

**Natural Language Commands**
```bash
# In your terminal or IDE
$ prodman "What should I work on next?"
> Based on roadmap priority and your recent commits:
> 1. Issue #44: OAuth callback handling (blocks EP-001)
> 2. Issue #51: Payment webhook retry logic
> Ready to start #44? I can create a branch and summarize context.

$ prodman "Write a spec for rate limiting"
> Created: .prodman/specs/rate-limiting.md
> - Analyzed existing auth code patterns
> - Referenced decisions/002-api-style.md
> - Linked to relevant issues #12, #34
> Review and refine?

$ prodman "Why did we choose PostgreSQL?"
> From decisions/001-db-choice.md (authored by @bob, 2024-03-15):
> - Needed JSONB for flexible schemas
> - Team expertise was primarily SQL
> - Rejected MongoDB due to transaction requirements
> Related commits: abc123, def456
```

**Autonomous Agents**
```yaml
# .prodman/agents.yaml
agents:
  spec-keeper:
    trigger: "on_merge"
    action: "update_spec_status"
    description: "Updates spec implementation percentages"
  
  stale-hunter:
    trigger: "weekly"
    action: "flag_stale_issues"
    threshold: "14 days"
  
  release-notes:
    trigger: "on_tag"
    action: "generate_changelog"
    format: "customer-facing"
```

---

### 3. Visual Interfaces (Read from Git)

**Web Dashboard** — renders `.prodman/` as visual views:

- **Roadmap View**: Timeline from `roadmap.yaml`
- **Kanban Board**: Issues from `issues/` or GitHub Issues
- **Spec Browser**: Rendered markdown with live status
- **Dependency Graph**: Auto-generated from epic links
- **Metrics Dashboard**: OKRs with real data

**Key insight**: The UI is a *view layer*, not the source of truth.

```
┌─────────────────────────────────────────────────────────────┐
│  git-prodman                                    [Sync: Live] │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard  │  🗺️ Roadmap  │  📋 Board  │  📝 Specs  │  🤖 AI │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Q1 2026                        Q2 2026                     │
│  ┌──────────────┐               ┌──────────────┐            │
│  │ User Auth    │──────────────▶│ Payments     │            │
│  │ ████████░░   │               │ ██░░░░░░░░   │            │
│  │ 80%          │               │ 20%          │            │
│  └──────────────┘               └──────────────┘            │
│         │                              │                    │
│         ▼                              ▼                    │
│  ┌──────────────┐               ┌──────────────┐            │
│  │ OAuth        │               │ Webhooks     │            │
│  │ In Progress  │               │ Not Started  │            │
│  └──────────────┘               └──────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. GitHub/GitLab Integration

**Bidirectional Sync (Optional)**
- GitHub Issues ↔ `issues/` folder
- PRs auto-link to specs via commit messages
- Labels/milestones sync to `roadmap.yaml`

**Or Pure Git Mode**
- No external dependencies
- Issues are markdown files
- Works offline, works anywhere

```bash
# Create issue from CLI
$ prodman issue create "Fix login timeout"
> Created: issues/open/87-fix-login-timeout.md
> Linked to: epics/user-auth.yaml
> Suggested assignee: @alice (most commits in auth/)
```

---

### 5. Traceability Chain

Every piece of work traces back to its origin:

```
Customer Feedback
       ↓
   product.yaml (OKR)
       ↓
   roadmap.yaml (Milestone)
       ↓
   epics/feature.yaml
       ↓
   specs/feature.md
       ↓
   issues/42-implement.md
       ↓
   src/feature.ts (code)
       ↓
   Commit → PR → Release
```

**Git blame becomes product archaeology:**
```bash
$ git log --follow .prodman/specs/payments.md
# See every decision, revision, and why
```

---

## Technical Architecture

### Core Design: Single Binary with Bundled Web UI

The CLI is a **single binary** that bundles everything:

```bash
# Install via npm/bun (recommended)
$ npm install -g git-prodman
# or
$ bun install -g git-prodman

# Or download standalone binary
$ curl -fsSL https://git-prodman.dev/install.sh | sh

# Start the local web UI
$ prodman ui
> 🚀 git-prodman running at http://localhost:3333
> 📁 Watching: /Users/alice/projects/acme-app/.prodman
> 🤖 Agent: Claude 3.5 Sonnet (via Anthropic API)
> 
> Open in browser? [Y/n]
```

**Why this stack?**
- **TypeScript everywhere** — same language for CLI and Web UI
- **Bun binary** — standalone executable via `bun build --compile`
- **isomorphic-git** — pure JS, no native compilation issues
- **Fast startup** — ~150ms, acceptable for CLI
- **Huge contributor pool** — more devs know TS than Rust

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      git-prodman (single binary)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CLI Interface                          │  │
│  │   prodman ui | prodman sync | prodman "query"             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │               Embedded Web Server                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Bundled SPA (Web UI)                   │  │  │
│  │  │   - Roadmap View      - Kanban Board               │  │  │
│  │  │   - Spec Editor       - AI Chat Panel              │  │  │
│  │  │   - Diff Viewer       - Commit History             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                    Core Engine                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ YAML/MD     │ │ Git Ops     │ │ Commit-per-Change   │  │  │
│  │  │ Parser      │ │ (libgit2)   │ │ Manager             │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Link        │ │ Status      │ │ Search Index        │  │  │
│  │  │ Resolver    │ │ Computer    │ │ (tantivy)           │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                   AI Agent Layer                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │            Provider Abstraction                     │  │  │
│  │  │   OpenAI | Anthropic | Ollama | Azure | Bedrock    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │            Agent Definitions                        │  │  │
│  │  │   spec-writer | issue-breaker | status-updater     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Every Edit = A Commit

**The Git-Native Edit Model:**

```
┌─────────────────────────────────────────────────────────────┐
│  Web UI: Editing spec "user-auth.md"                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [User types in the editor]                                 │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Pending Changes │  ← UI shows unsaved indicator          │
│  │ (working tree)  │                                        │
│  └────────┬────────┘                                        │
│           │ [User clicks "Save" or Ctrl+S]                  │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Auto-Commit     │  commit: "Update user-auth spec"       │
│  │ (local only)    │  author: alice@acme.com                │
│  └────────┬────────┘  timestamp: 2026-01-11T10:30:00        │
│           │                                                 │
│           │ [Accumulate multiple local commits]             │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Local Commits   │  ○ Update user-auth spec               │
│  │ (not pushed)    │  ○ Add acceptance criteria             │
│  │                 │  ○ Link to issue #42                   │
│  └────────┬────────┘                                        │
│           │ [User clicks "Sync" or prodman sync]            │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Push to Remote  │  → origin/main                         │
│  │ (with review?)  │                                        │
│  └─────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- **Undo is free**: `git revert` any change
- **History is automatic**: No "version history" feature needed
- **Blame works**: Who changed what and when
- **Offline-first**: Work without internet, sync later
- **Branches work**: Experiment with spec changes safely

### Configuration System

```yaml
# .prodman/config.yaml — Repo-level config (committed)
schema_version: 1

project:
  name: "Acme Platform"
  default_branch: main
  
sync:
  remote: origin
  auto_push: false          # Manual sync by default
  branch_strategy: direct   # or "pr" for review workflow

integrations:
  github:
    enabled: true
    sync_issues: bidirectional
    sync_labels: true
  slack:
    webhook: "${SLACK_WEBHOOK}"  # Env var reference
    channels:
      releases: "#product-releases"
      blockers: "#eng-blockers"

templates:
  epic: ".prodman/templates/epic.yaml"
  spec: ".prodman/templates/spec.md"
  decision: ".prodman/templates/adr.md"
```

```yaml
# ~/.config/prodman/config.yaml — User-level config (not committed)
ai:
  provider: anthropic       # openai | anthropic | ollama | azure
  model: claude-3-5-sonnet
  api_key: "${ANTHROPIC_API_KEY}"
  
  # Or local model
  # provider: ollama
  # model: llama3.2
  # endpoint: http://localhost:11434

preferences:
  editor: cursor            # Opens specs in preferred editor
  theme: dark
  auto_commit_message: true # AI generates commit messages

agents:
  # Override or extend repo-level agents
  custom-reporter:
    trigger: "friday 5pm"
    action: "weekly_summary"
    output: "slack:#pm-updates"
```

### Agent Definition System

```yaml
# .prodman/agents.yaml
agents:
  # Built-in agents with custom config
  spec-keeper:
    enabled: true
    trigger: on_merge
    config:
      update_progress: true
      link_commits: true
      
  # Custom agent definition
  standup-prep:
    description: "Prepares daily standup summary"
    trigger: "daily 9am"
    prompt: |
      Analyze commits from last 24 hours and open issues.
      Generate a standup summary with:
      - What was completed
      - What's in progress  
      - Any blockers
    output:
      - file: ".prodman/standups/{{date}}.md"
      - slack: "#daily-standup"
      
  # Agent triggered by slash command
  break-it-down:
    description: "Breaks a spec into implementable issues"
    trigger: command  # Invoked via: prodman agent break-it-down <spec>
    input: spec_file
    prompt: |
      Read the spec at {{input}}.
      Break it into small, implementable issues.
      Each issue should be completable in < 1 day.
      Consider dependencies and suggest order.
    output:
      - create_issues: true
      - link_to_epic: true
```

### Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Language** | TypeScript 5.x | Type safety, same lang for CLI + Web UI |
| **Runtime** | Bun | Fast, built-in bundler, `bun build --compile` for binary |
| **CLI** | Commander.js + @clack/prompts | Mature CLI + beautiful terminal UI |
| **Web Server** | Hono | Lightweight, fast, Bun-optimized |
| **Web UI** | React + Tailwind | Component reuse, huge ecosystem |
| **Git** | isomorphic-git | Pure JS, no native deps, works everywhere |
| **Database** | None (Git is the DB) | — |
| **Search** | minisearch | Lightweight full-text search |
| **AI SDK** | openai + @anthropic-ai/sdk + ollama | Official SDKs, first-class TS support |
| **Config** | yaml + gray-matter | YAML parsing + markdown frontmatter |

---

## User Workflows

### Workflow 1: Starting a New Feature

```bash
# 1. Product manager creates epic
$ prodman epic create "User Notifications"
> Created: .prodman/epics/user-notifications.yaml
> Want me to draft a spec? [Y/n]

# 2. AI drafts spec based on product context
$ prodman spec draft user-notifications
> Analyzing product.yaml, existing patterns...
> Created: .prodman/specs/user-notifications.md
> Suggested sections based on your previous specs.

# 3. Create issues from spec
$ prodman issues from-spec user-notifications
> Created 5 issues:
> - #88: Notification data model
> - #89: Push notification service
> - #90: Email notification service
> - #91: In-app notification UI
> - #92: Notification preferences

# 4. Developer picks up work
$ prodman next
> Recommended: #88 (blocks others, matches your expertise)
> Context: [summary of spec, dependencies, related code]
```

### Workflow 2: Status Update (Automated)

```bash
# On PR merge, git hook runs:
$ prodman sync

# Auto-updates:
# - Epic progress percentages
# - Spec implementation status
# - Closes linked issues
# - Updates roadmap if milestone complete
```

### Workflow 3: Stakeholder Report

```bash
$ prodman report weekly
> Generated: reports/2026-W02.md
> 
> ## This Week
> - Completed: EP-001 User Auth (100%)
> - In Progress: EP-002 Payments (45%)
> - Blocked: #92 (waiting on design)
> 
> ## Metrics
> - Velocity: 23 points (↑ from 19)
> - Cycle time: 2.3 days (↓ from 3.1)
> 
> Share to Slack? [Y/n]
```

### Workflow 4: Web UI Agent-Assisted Editing

```
┌─────────────────────────────────────────────────────────────────┐
│  git-prodman • acme-platform                    [● 3 unsaved]   │
├────────────────────┬────────────────────────────────────────────┤
│  📁 Explorer       │  user-auth.md                    [Spec]    │
│  ─────────────     │  ────────────────────────────────────────  │
│  ▼ .prodman        │  # User Authentication                     │
│    ▶ epics         │                                            │
│    ▼ specs         │  ## Overview                               │
│      • user-auth ● │  Users should be able to sign up and       │
│      • payments    │  log in securely using email/password      │
│    ▶ decisions     │  or OAuth providers.                       │
│                    │                                            │
│                    │  ## Acceptance Criteria                    │
│                    │  - [ ] Email signup with verification      │
│                    │  - [ ] Password reset flow                 │
│                    │  - [x] OAuth with Google ← linked: #43     │
│                    │                                            │
├────────────────────┴────────────────────────────────────────────┤
│  🤖 AI Assistant                                    [Claude 3.5] │
│  ────────────────────────────────────────────────────────────── │
│  You: "Add acceptance criteria for rate limiting"               │
│                                                                 │
│  Agent: I'll add rate limiting criteria based on your           │
│  decisions/002-api-style.md which specifies 100 req/min.        │
│                                                                 │
│  Added to spec:                                                 │
│  - [ ] Rate limit: 100 requests/min per user                    │
│  - [ ] Return 429 with Retry-After header                       │
│                                                                 │
│  [Apply] [Edit] [Reject]           Commit: "Add rate limiting"  │
├─────────────────────────────────────────────────────────────────┤
│  📜 Pending Commits (3)                              [Sync ↑]   │
│  ○ Add rate limiting criteria (just now)                        │
│  ○ Update OAuth status to complete (2 min ago)                  │
│  ○ Link issue #43 to spec (5 min ago)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow 5: Sharing & Export (Local-First)

```bash
# Export static HTML (shareable anywhere)
$ prodman export roadmap --format html
> Generated: exports/roadmap.html
> Self-contained, no server needed. Send via email, Slack, etc.

# Export for presentations
$ prodman export roadmap --format pdf
> Generated: exports/roadmap-2026-Q1.pdf

$ prodman export roadmap --format slides
> Generated: exports/roadmap-2026-Q1.pptx

# Export entire .prodman/ as static site
$ prodman export site --output ./public
> Generated: ./public/index.html
> Host anywhere: GitHub Pages, Netlify, S3, or local file://

# Serve locally for quick sharing on same network
$ prodman serve --port 8080
> 📡 Serving at http://192.168.1.100:8080
> Share this URL with teammates on your network
> Read-only view, no auth needed
> Press Ctrl+C to stop
```

**No Cloud Required:**
- All exports are static files you own
- Host on your own infrastructure
- Works on airgapped networks
- No accounts, no tracking, no analytics

---

## Collaboration Model

### Async-First Philosophy

**Git's model is inherently async.** We embrace this, not fight it.

```
┌─────────────────────────────────────────────────────────────┐
│  Why Async-First Works for Product Management               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ PMs don't need real-time — specs aren't Google Docs      │
│  ✓ Thoughtful commits > frantic typing                      │
│  ✓ Review before merge = better quality                     │
│  ✓ Full history of every decision                           │
│  ✓ Works across timezones                                   │
│  ✓ Works offline (planes, coffee shops, VPNs)               │
│                                                             │
│  ✗ NOT building: real-time cursors, presence indicators     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Multi-PM Workflows

**Option A: Direct to Main (Small Teams)**
```
PM edits in Web UI
      ↓
Local commits accumulate
      ↓
prodman sync → pushes to main
      ↓
Other PMs: prodman pull
```

**Option B: Branch + PR (Larger Teams)**
```yaml
# .prodman/config.yaml
sync:
  branch_strategy: pr
  auto_branch_name: "prodman/{{date}}-{{user}}"
```

```
PM edits in Web UI
      ↓
Local commits on feature branch
      ↓
prodman sync → creates PR "prodman/2026-01-11-alice"
      ↓
Review in GitHub/GitLab (use existing review tools!)
      ↓
Merge → main updated
```

### Conflict Resolution

Conflicts happen. We make them easy to resolve:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Sync Conflict                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  File: .prodman/epics/user-auth.yaml                        │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐         │
│  │ Your version        │    │ Remote version      │         │
│  │ ─────────────────── │    │ ─────────────────── │         │
│  │ status: complete    │ vs │ status: in_progress │         │
│  │ owner: @alice       │    │ owner: @bob         │         │
│  └─────────────────────┘    └─────────────────────┘         │
│                                                             │
│  🤖 AI Suggestion: Remote shows @bob took over while you    │
│     were offline. Their status is more recent.              │
│                                                             │
│  [Keep Yours] [Take Theirs] [Manual Edit] [AI Merge]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Access Control (Use Git!)

**We don't reinvent permissions. Git already has them.**

```bash
# Use GitHub/GitLab branch protection
# Use CODEOWNERS for review requirements
# Use .gitattributes for merge strategies
```

```
# CODEOWNERS
.prodman/product.yaml    @product-lead
.prodman/roadmap.yaml    @product-lead
.prodman/epics/*         @product-team
.prodman/specs/*         @product-team @eng-lead
.prodman/decisions/*     @product-lead @eng-lead
```

**For sensitive repos:**
- Private GitHub/GitLab repo = access control
- SSH keys = authentication
- Branch protection = approval workflows
- No need for a separate permissions system

---

## Additional Features

### 1. Full-Text Search

```bash
$ prodman search "payment webhook retry"
> 
> 📝 specs/payments.md (line 45)
>    "Webhook delivery should retry with exponential backoff..."
> 
> 📋 issues/open/51-webhook-retry.md
>    "Implement retry logic for failed webhook deliveries"
> 
> 🗒️ decisions/003-webhook-design.md
>    "Decision: Use exponential backoff starting at 1s..."
> 
> 💻 src/webhooks/retry.ts (line 12)
>    "const RETRY_DELAYS = [1000, 2000, 4000, 8000];"
```

### 2. Multi-Repo Portfolio View

```bash
$ prodman portfolio add ~/projects/acme-api
$ prodman portfolio add ~/projects/acme-web
$ prodman portfolio add ~/projects/acme-mobile

$ prodman ui --portfolio
> 🚀 Portfolio view at http://localhost:3333/portfolio
```

```
┌─────────────────────────────────────────────────────────────┐
│  git-prodman • Portfolio View                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  acme-api          acme-web         acme-mobile             │
│  ┌──────────┐      ┌──────────┐     ┌──────────┐            │
│  │ ████░░   │      │ ██████░░ │     │ ██░░░░░░ │            │
│  │ Auth 70% │      │ UI 85%   │     │ App 25%  │            │
│  └──────────┘      └──────────┘     └──────────┘            │
│  3 blockers        0 blockers       1 blocker               │
│                                                             │
│  Cross-Repo Dependencies:                                   │
│  ─────────────────────────                                  │
│  acme-web/EP-003 ──blocks──▶ acme-api/EP-007               │
│  acme-mobile/EP-001 ──needs──▶ acme-api/EP-004             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Templates & Scaffolding

```bash
$ prodman init
> Initializing git-prodman in /Users/alice/new-project
> 
> Choose a template:
> 1. Minimal (product.yaml + roadmap.yaml)
> 2. Standard (+ specs/, epics/, decisions/)
> 3. Open Source (+ CONTRIBUTING, ROADMAP.md public)
> 4. Custom (point to your own template repo)
> 
> Selected: 2

$ prodman epic create "New Feature" --template detailed
> Created from template: .prodman/templates/epic-detailed.yaml
```

### 4. Import from Existing Tools

```bash
$ prodman import jira --project ACME
> Connecting to Jira...
> Found 234 issues, 12 epics
> 
> Import strategy:
> - Epics → .prodman/epics/
> - Stories → issues/open/
> - Done items → issues/closed/
> - Attachments → .prodman/attachments/
> 
> Proceed? [Y/n]
> 
> ✅ Imported 234 issues
> ✅ Preserved links and comments
> ✅ Mapped custom fields to YAML

$ prodman import linear --team product
$ prodman import notion --database "Product Roadmap"
$ prodman import github-projects --project 1
```

### 5. Notifications & Alerts

```yaml
# .prodman/alerts.yaml
alerts:
  stale_issues:
    condition: "issue.updated_at < 14.days.ago"
    action: notify
    channel: slack:#pm-alerts
    message: "Issue {{issue.id}} hasn't been updated in 2 weeks"
    
  blocked_epic:
    condition: "epic.has_blocker"
    action: notify
    channel: email:product-leads@acme.com
    
  milestone_at_risk:
    condition: "milestone.progress < milestone.expected_progress"
    action: notify
    channel: slack:#product
```

### 6. Non-Technical User Mode

For stakeholders who fear Git:

```bash
$ prodman ui --simple
> 🌐 Simple mode at http://localhost:3333
> Git operations hidden, auto-sync enabled
```

```
┌─────────────────────────────────────────────────────────────┐
│  Product Hub • Acme Platform                    [Auto-save ✓]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  No Git terminology visible                                 │
│  No commits, branches, sync buttons                         │
│  Just: View, Edit, Save                                     │
│                                                             │
│  Behind the scenes:                                         │
│  - Auto-commit on save                                      │
│  - Auto-sync every 5 minutes                                │
│  - Conflicts auto-resolved (theirs wins) or flagged        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7. Time Tracking Integration

```yaml
# .prodman/epics/user-auth.yaml
id: EP-001
title: "User Authentication"
time_tracking:
  estimated: 40h
  logged:
    - date: 2026-01-08
      hours: 4
      user: "@alice"
      note: "OAuth research"
    - date: 2026-01-09
      hours: 6
      user: "@alice" 
      note: "Implementation started"
  # Or integrate with external
  external: toggl
  toggl_project_id: 12345
```

### 8. Design Tool Integration

```yaml
# .prodman/specs/user-auth.md
---
figma: https://figma.com/file/abc123
figma_sync: true  # Pull comments as feedback
---

# User Authentication

## Designs
<!-- AUTO-EMBEDDED -->
![Login Screen](figma://abc123/frame/login)
![Signup Flow](figma://abc123/frame/signup)

## Design Feedback (from Figma)
<!-- AUTO-SYNCED -->
- @designer: "Should we add social login buttons?" (Jan 8)
- @pm: "Yes, Google and GitHub" (Jan 8)
```

---

## Competitive Advantages

| vs. | git-prodman wins because |
|-----|--------------------------|
| **Jira** | No sync drift, AI-native, lives with code |
| **Linear** | Open source, no vendor lock-in, full context |
| **Notion** | Specs are executable, not just docs |
| **GitHub Projects** | Richer PM features, works across forges |
| **Plane/Huly** | Git-native (not just git-integrated) |

---

## Go-to-Market

### Target Users

1. **Primary**: Open source maintainers
   - Pain: Contributors lack context, roadmap hidden in heads
   - Value: Self-documenting repos, everything in the open
   - Why they'll love it: MIT license, no accounts, works offline

2. **Secondary**: Dev-heavy startups (2-30 people)
   - Pain: Outgrowing GitHub Issues, hate Jira, no budget
   - Value: AI automation, single source of truth, free forever
   - Why they'll love it: Fast, local, no vendor lock-in

3. **Tertiary**: Solo developers & indie hackers
   - Pain: Need structure but Jira is overkill
   - Value: Lightweight, lives in repo, AI helps think
   - Why they'll love it: Zero setup, works in any repo

4. **Privacy-conscious teams**
   - Pain: Can't use cloud tools (legal, security, air-gapped)
   - Value: 100% local, no telemetry, no accounts
   - Why they'll love it: Data never leaves their machine

### Pricing Model

**There is no pricing. It's free. Forever.**

| What You Get | Cost |
|--------------|------|
| CLI + Bundled Web UI | Free |
| All features | Free |
| AI integration (bring your own key) | Free |
| GitHub/GitLab sync | Free |
| Source code (MIT) | Free |
| Commercial use | Free |
| Modify & redistribute | Free |

**Sustainability Model:**
- GitHub Sponsors / Open Collective donations
- Consulting/support for large deployments
- Bounties for specific features
- Community contributions

**Why MIT?**
- Maximum adoption = maximum community = better product
- No "open core" bait-and-switch
- Enterprises can fork and customize without legal risk
- Aligns with Git's own open ethos

### Launch Strategy

**Phase 1: MVP** (Week 1-8)
- [ ] Single binary (Rust) with embedded web UI
- [ ] Basic YAML/MD parsing for `.prodman/`
- [ ] `prodman init`, `prodman ui`, `prodman sync`
- [ ] Local AI support (Ollama first, then API providers)
- [ ] **Launch: Hacker News "Show HN"**

**Phase 2: Usability** (Week 9-16)
- [ ] Import from Jira/Linear/Notion
- [ ] Export to HTML/PDF/slides
- [ ] Full-text search (tantivy)
- [ ] VS Code/Cursor extension
- [ ] Better conflict resolution UI

**Phase 3: Community** (Week 17-24)
- [ ] Plugin/extension system for custom agents
- [ ] Template marketplace (community-contributed)
- [ ] Multi-repo portfolio view
- [ ] Better GitHub/GitLab integration
- [ ] Documentation site

**Phase 4: Polish** (Week 25+)
- [ ] Performance optimization for large repos
- [ ] Mobile-friendly web UI
- [ ] Accessibility (a11y) audit
- [ ] i18n (internationalization)
- [ ] Video tutorials & guides

**No Enterprise Tier.** Features like SSO/audit logs? Use your Git host's features.

---

## Open Questions

### Technical
- [ ] Bun binary size ~50-60MB acceptable? Or prioritize npm install?
- [ ] Bundle React into binary or load from CDN in dev mode?
- [ ] How to handle large repos with 1000+ issues? Lazy loading?
- [ ] How to handle `.prodman/` in monorepos with multiple products?
- [ ] Use minisearch in-memory or persist index to disk?

### Product  
- [ ] How deep should GitHub Issues integration go? Mirror vs. bridge?
- [ ] Should specs support MDX/Jupyter, or just Markdown?
- [ ] "Simple mode" for non-technical users — how simple?
- [ ] Plugin system: Lua? WASM? Just shell scripts?
- [ ] Default templates: minimal or opinionated?

### Community
- [ ] How to attract contributors? Good first issues, mentorship?
- [ ] Governance model? BDFL vs. committee?
- [ ] Where to host discussions? GitHub Discussions? Discord?
- [ ] How to handle competing forks?

---

## What Might Still Be Missing?

### 🤔 Consider Adding

| Gap | Description | Priority |
|-----|-------------|----------|
| **Custom Fields** | Teams want their own YAML schemas | High |
| **Dependency Visualization** | Interactive graph of epic/issue dependencies | High |
| **Changelogs** | Auto-generate from commits for external comms | High |
| **Plugin System** | Let community build custom agents/views | High |
| **Approval Workflows** | Use CODEOWNERS, but add UI hints | Medium |
| **Voting/Prioritization** | RICE scoring in YAML, UI for manipulation | Medium |
| **Offline Sync Queue** | Better UX for offline-first editing | Medium |
| **AI Cost Tracking** | Show token usage (local display, no telemetry) | Medium |
| **Calendar Links** | Link specs to meeting notes (just URLs) | Low |
| **Mobile-Friendly UI** | Responsive web UI for phone browsers | Low |

### 🚫 Explicitly NOT Building

| Feature | Why Not |
|---------|---------|
| **Real-time Multiplayer** | Async-first. Git's model. Period. |
| **Cloud/Hosted Service** | Local-only. Your data, your machine. |
| **User Accounts** | No accounts. No login. No tracking. |
| **Telemetry/Analytics** | We don't want your data. |
| **Enterprise Tier** | MIT. Same features for everyone. |
| **Built-in Chat** | Slack/Teams exist. |
| **Time Tracking** | Integrate with existing tools. |
| **Bug Tracking** | GitHub Issues does this. |
| **SSO/SAML** | Use your Git host's auth. |
| **Proprietary Anything** | MIT everything. |

---

## Success Metrics

### Adoption Metrics
- GitHub stars (vanity but signals awareness)
- Homebrew/cargo installs per week
- Repos with `.prodman/` on GitHub (searchable!)
- Discord/community members

### Usage Metrics (Self-Reported / Opt-In)
- `prodman ui` sessions per week
- Commits to `.prodman/` directories
- Specs created per project
- AI queries per session (local tracking only)

### Quality Metrics
- Issue close time (are we making PM faster?)
- Contributor count & PR merge rate
- User satisfaction (annual survey)
- "Would you recommend?" NPS

### Community Health
- Time to first response on issues
- % of issues with community responses
- Number of external contributors
- Forks with active development

---

## The Name: git-prodman

**Alternatives considered:**
- `repoman` — too generic
- `gitpm` — too short
- `codeplan` — doesn't emphasize git
- `repoflow` — sounds like CI/CD
- `specflow` — taken
- `prodgit` — awkward

**git-prodman** = Git + Product Management, clear and searchable.

---

## CLI Command Reference

```bash
# Setup & Config
prodman init                    # Initialize .prodman/ in repo
prodman config                  # Edit user config
prodman config --repo           # Edit repo config
prodman provider set anthropic  # Set AI provider
prodman provider test           # Verify API key works

# Web UI
prodman ui                      # Start bundled web UI
prodman ui --port 8080          # Custom port
prodman ui --simple             # Non-technical mode
prodman ui --portfolio          # Multi-repo view

# Creating Artifacts  
prodman epic create "Title"     # New epic
prodman spec draft <epic>       # AI drafts spec from epic
prodman issue create "Title"    # New issue
prodman decision create "Title" # New ADR

# AI Interactions
prodman "natural language"      # Ask anything
prodman next                    # What should I work on?
prodman agent run <name>        # Run specific agent
prodman agent list              # Show available agents

# Sync & Collaboration
prodman sync                    # Push local commits to remote
prodman pull                    # Get remote changes
prodman status                  # Show pending changes
prodman diff                    # Show what changed

# Sharing & Export
prodman share roadmap           # Generate share link
prodman export spec <name> pdf  # Export to PDF
prodman report weekly           # Generate status report

# Search & Query
prodman search "query"          # Full-text search
prodman list epics              # List all epics
prodman show EP-001             # Show epic details

# Import
prodman import jira --project X # Import from Jira
prodman import linear           # Import from Linear
prodman import notion           # Import from Notion
```

---

## Next Steps

### Immediate (This Week)
1. **Validate idea**: Post on Twitter/LinkedIn, gauge interest
2. **Name check**: Verify `git-prodman` domain/npm/crate available
3. **Competitive deep-dive**: Try Linear, Plane, Height — find gaps

### Short-term (Weeks 1-4)
4. **Prototype CLI**: Rust CLI with basic `init`, `ui`, `sync`
5. **Dogfood**: Use git-prodman to manage git-prodman development
6. **Design UI**: Figma mockups for bundled web interface
7. **Talk to users**: 10 interviews with dev-heavy startup PMs

### Medium-term (Weeks 5-12)
8. **Build MVP**: Full CLI + bundled UI
9. **Alpha testers**: 5 teams using it daily
10. **Launch**: Hacker News "Show HN" post
11. **Iterate**: Based on feedback

### Long-term
12. **Community**: Discord, GitHub discussions
13. **Extensions**: VS Code, Cursor plugins
14. **Sustainability**: GitHub Sponsors, Open Collective
15. **Ecosystem**: Plugin marketplace, template library

---

## One-Liner Pitch

> **git-prodman**: Product management that lives in your Git repo. Local-first, AI-native, MIT licensed. No cloud, no accounts, no bullshit.

---

## The MIT Promise

```
MIT License

Copyright (c) 2026 git-prodman contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

**What this means:**
- ✅ Use it commercially, no strings attached
- ✅ Modify it for your needs
- ✅ Fork it and build your own version
- ✅ Include it in proprietary software
- ✅ Sell support/consulting around it
- ❌ We can't take features away from you
- ❌ We can't force you to pay later
- ❌ We can't change the license on code you already have

**This is a promise, not a business model.**

---

*"The best product management tool is the one that disappears into your workflow."*
