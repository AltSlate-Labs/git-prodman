# Product Requirements Document: git-prodman v1.0

> **Status**: Draft  
> **Author**: Product Team  
> **Created**: 2026-01-11  
> **Last Updated**: 2026-01-11  
> **Target Release**: v1.0 MVP

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [MVP Scope](#10-mvp-scope)
11. [Out of Scope (v1.0)](#11-out-of-scope-v10)
12. [Dependencies & Risks](#12-dependencies--risks)
13. [Release Plan](#13-release-plan)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### 1.1 Product Vision

**git-prodman** is a local-first, AI-native product management tool where the Git repository IS the database. It provides a CLI and bundled web UI for managing product artifacts (PRDs, epics, specs, roadmaps, issues) as version-controlled files.

### 1.2 One-Liner

> Product management that lives in your Git repo. Local-first, AI-native, MIT licensed. No cloud, no accounts, no bullshit.

### 1.3 Core Principles

| Principle | Description |
|-----------|-------------|
| **Async-First** | Git's commit→push→pull model. No real-time collaboration. |
| **Local-Only** | All data stays on user's machine. No telemetry, no accounts. |
| **MIT Licensed** | 100% open source. No "open core" restrictions. |
| **AI-Optional** | Works without AI. Users bring their own API keys or use local models. |

### 1.4 Target Release

- **Version**: 1.0.0 (MVP)
- **Timeline**: 8 weeks from project start
- **Distribution**: Single binary for macOS, Linux, Windows

---

## 2. Problem Statement

### 2.1 The Context Fragmentation Problem

Product teams use multiple disconnected tools:

| Tool Category | Examples | Problem |
|---------------|----------|---------|
| Issue Tracking | Jira, Linear, Asana | Disconnected from code reality |
| Documentation | Notion, Confluence | Specs drift from implementation |
| Communication | Slack, Teams | Decisions lost in chat |
| Status Tracking | Spreadsheets | Manual updates, always stale |
| Design | Figma | Links break, versions mismatch |

**Impact:**
- 23% of work week lost to context switching (Forrester)
- PRDs become fiction within days of writing
- "What was decided?" requires archaeology
- AI assistants lack context, hallucinate
- Onboarding new team members takes weeks

### 2.2 Why Existing Solutions Fail

| Solution | Why It Fails |
|----------|--------------|
| **Jira** | Complex, disconnected from code, vendor lock-in |
| **Linear** | Cloud-only, proprietary, no AI integration |
| **GitHub Projects** | Thin layer, no spec management, no AI |
| **Notion** | Not code-aware, sync issues, cloud-dependent |
| **Plane/Huly** | Git-integrated but not git-native |

### 2.3 The Opportunity

Create a tool where:
- All product artifacts live in the Git repository
- Every change is a commit (automatic history)
- AI agents can read full context (code + specs + decisions)
- No separate database means no sync drift
- Local-first means privacy + offline work

---

## 3. Goals & Success Metrics

### 3.1 Product Goals (v1.0)

| # | Goal | Measurable Outcome |
|---|------|-------------------|
| G1 | Enable git-native product management | Users can create/edit epics, specs, roadmaps as files |
| G2 | Provide visual interface for non-technical editing | Bundled web UI renders and edits `.prodman/` |
| G3 | Support AI-assisted workflows | Natural language queries work with context |
| G4 | Work 100% locally | No network required except for AI API calls |
| G5 | Single binary distribution | `curl \| sh` install, no dependencies |

### 3.2 Success Metrics

**Adoption (6 months post-launch):**
- 1,000+ GitHub stars
- 500+ weekly active installs (Homebrew + cargo)
- 100+ repos with `.prodman/` on GitHub
- 50+ Discord community members

**Quality:**
- < 5 critical bugs reported in first month
- < 500ms startup time for CLI
- < 2s for web UI to become interactive
- Binary size < 30MB

**User Satisfaction:**
- NPS > 40 (survey of active users)
- > 50% of installers use it beyond first day

### 3.3 Non-Goals (v1.0)

- Real-time multiplayer editing
- Cloud hosting / SaaS offering
- User accounts / authentication
- Mobile native apps
- Enterprise features (SSO, audit logs)

---

## 4. User Personas

### 4.1 Primary: "Oscar" — Open Source Maintainer

**Demographics:**
- Maintains 2-3 popular open source projects
- 5-10 years of development experience
- Works asynchronously with global contributors

**Pain Points:**
- Roadmap is in their head, contributors ask repeatedly
- Context scattered across issues, discussions, docs
- No budget for paid tools
- Privacy-conscious about project data

**Goals:**
- Make project direction transparent
- Reduce "what should I work on?" questions
- Enable contributors to self-serve context

**git-prodman Value:**
- Roadmap.yaml visible in repo
- Specs linked to issues
- AI can answer contributor questions

---

### 4.2 Secondary: "Sara" — Startup PM/Founder

**Demographics:**
- Technical founder or PM at 5-20 person startup
- Wears multiple hats (PM, sometimes codes)
- Fast-moving, limited budget

**Pain Points:**
- Jira is overkill, GitHub Issues too simple
- Specs in Notion disconnect from development
- Context lost when switching between tools
- Hates vendor lock-in

**Goals:**
- Single source of truth for product
- Quick setup, minimal overhead
- AI to help draft specs and prioritize

**git-prodman Value:**
- Everything in repo = single source of truth
- AI drafts specs from one-liners
- Free forever, MIT licensed

---

### 4.3 Tertiary: "Ian" — Indie Hacker / Solo Dev

**Demographics:**
- Building side projects or solo products
- Does everything themselves
- Values simplicity and speed

**Pain Points:**
- Needs some structure but hates overhead
- Forgets what they decided and why
- No team to keep them accountable

**Goals:**
- Lightweight project management
- Remember decisions and context
- AI as a thinking partner

**git-prodman Value:**
- Zero setup (lives in repo)
- AI to brainstorm and break down work
- Decisions tracked in version control

---

### 4.4 Edge Case: "Patricia" — Privacy-Conscious PM

**Demographics:**
- Works at company with strict data policies
- May be in regulated industry (finance, health)
- Air-gapped or restricted network environment

**Pain Points:**
- Can't use cloud tools (security policy)
- Needs full control over data location
- Compliance requirements for audit trails

**Goals:**
- 100% local tool with no data exfiltration
- Audit trail built into Git history
- Works offline / on restricted networks

**git-prodman Value:**
- No cloud, no telemetry, no accounts
- Git history IS the audit log
- Works completely offline (with local AI)

---

## 5. User Stories

### 5.1 Initialization & Setup

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-001 | New user | Install with single command | I can start using it immediately | P0 |
| US-002 | New user | Initialize `.prodman/` in my repo | My repo becomes a product management system | P0 |
| US-003 | User | Configure my AI provider | AI features work with my preferred LLM | P0 |
| US-004 | User | Choose from templates during init | I get a sensible starting structure | P1 |

### 5.2 Core Product Management

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-010 | PM | Create a new epic | I can track a major feature/initiative | P0 |
| US-011 | PM | Create/edit specs as markdown | I can write detailed requirements | P0 |
| US-012 | PM | Define roadmap with milestones | Team knows what's planned when | P0 |
| US-013 | PM | Create issues linked to epics | Work is traceable to requirements | P1 |
| US-014 | PM | Record architectural decisions (ADRs) | We remember why we made choices | P1 |
| US-015 | PM | Define product vision and OKRs | Strategy is documented and visible | P1 |

### 5.3 Web UI

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-020 | User | Start web UI from CLI | I can visually browse/edit product data | P0 |
| US-021 | User | See roadmap as timeline view | I understand project timeline at a glance | P0 |
| US-022 | User | Edit specs in a rich editor | I don't need to hand-write markdown | P0 |
| US-023 | User | See pending commits before sync | I know what will be pushed | P0 |
| US-024 | Non-technical user | Use "simple mode" without Git jargon | I can participate without Git knowledge | P2 |

### 5.4 AI Assistance

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-030 | User | Ask natural language questions | AI answers using my product context | P0 |
| US-031 | PM | Have AI draft a spec from brief | I save time on initial spec writing | P1 |
| US-032 | PM | Have AI break spec into issues | Work is automatically decomposed | P1 |
| US-033 | User | Ask "what should I work on next?" | AI prioritizes based on roadmap/blockers | P1 |
| US-034 | User | Use local LLM (Ollama) | I don't need internet or API keys | P1 |

### 5.5 Sync & Collaboration

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-040 | User | Sync local changes to remote | Team sees my updates | P0 |
| US-041 | User | Pull remote changes | I have latest from team | P0 |
| US-042 | User | See and resolve conflicts | I can merge divergent changes | P0 |
| US-043 | User | Every save creates a commit | I have automatic version history | P0 |

### 5.6 Export & Sharing

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-050 | PM | Export roadmap as HTML | I can share with stakeholders | P1 |
| US-051 | PM | Export spec as PDF | I can attach to external documents | P2 |
| US-052 | User | Serve UI on local network | Teammates can view without installing | P2 |

### 5.7 Search & Discovery

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-060 | User | Search across all product artifacts | I can find relevant context quickly | P1 |
| US-061 | User | List all epics/specs/issues | I can see everything in one view | P0 |
| US-062 | User | See relationships between artifacts | I understand dependencies | P1 |

---

## 6. Functional Requirements

### 6.1 CLI Commands

#### 6.1.1 Initialization & Config

| Command | Description | MVP |
|---------|-------------|-----|
| `prodman init` | Initialize `.prodman/` in current repo | ✅ |
| `prodman config` | Open/edit user config | ✅ |
| `prodman config --repo` | Open/edit repo config | ✅ |
| `prodman provider set <name>` | Set AI provider (anthropic/openai/ollama) | ✅ |
| `prodman provider test` | Verify AI provider connection | ✅ |

#### 6.1.2 Web UI

| Command | Description | MVP |
|---------|-------------|-----|
| `prodman ui` | Start bundled web UI on localhost | ✅ |
| `prodman ui --port <n>` | Custom port | ✅ |
| `prodman ui --simple` | Non-technical mode (hides Git) | ❌ v1.1 |
| `prodman serve` | Read-only server for network sharing | ❌ v1.1 |

#### 6.1.3 Artifact Management

| Command | Description | MVP |
|---------|-------------|-----|
| `prodman epic create "<title>"` | Create new epic | ✅ |
| `prodman epic list` | List all epics | ✅ |
| `prodman epic show <id>` | Show epic details | ✅ |
| `prodman spec create "<title>"` | Create new spec | ✅ |
| `prodman spec draft <epic>` | AI drafts spec from epic | ❌ v1.1 |
| `prodman issue create "<title>"` | Create new issue | ✅ |
| `prodman decision create "<title>"` | Create new ADR | ✅ |
| `prodman list <type>` | List artifacts of type | ✅ |
| `prodman show <id>` | Show artifact details | ✅ |

#### 6.1.4 AI Interactions

| Command | Description | MVP |
|---------|-------------|-----|
| `prodman "<query>"` | Natural language query | ✅ |
| `prodman next` | AI suggests next task | ❌ v1.1 |
| `prodman agent list` | List available agents | ❌ v1.1 |
| `prodman agent run <name>` | Run specific agent | ❌ v1.1 |

#### 6.1.5 Sync & Status

| Command | Description | MVP |
|---------|-------------|-----|
| `prodman sync` | Push local commits to remote | ✅ |
| `prodman pull` | Pull remote changes | ✅ |
| `prodman status` | Show pending changes | ✅ |
| `prodman diff` | Show uncommitted changes | ✅ |

#### 6.1.6 Search & Export

| Command | Description | MVP |
|---------|-------------|-----|
| `prodman search "<query>"` | Full-text search | ✅ |
| `prodman export <type> --format <fmt>` | Export to HTML/PDF | ❌ v1.1 |

### 6.2 File Schema

#### 6.2.1 Directory Structure

```
.prodman/
├── config.yaml           # Repo configuration
├── product.yaml          # Product vision, OKRs
├── roadmap.yaml          # Milestones, timeline
├── epics/
│   └── <slug>.yaml       # Epic definitions
├── specs/
│   └── <slug>.md         # PRDs, spec documents
├── decisions/
│   └── <nnn>-<slug>.md   # ADRs (numbered)
├── templates/            # Optional templates
│   ├── epic.yaml
│   └── spec.md
└── agents.yaml           # Agent definitions (optional)
```

#### 6.2.2 config.yaml Schema

```yaml
schema_version: 1

project:
  name: string            # Required
  description: string     # Optional
  default_branch: string  # Default: "main"

sync:
  remote: string          # Default: "origin"
  auto_push: boolean      # Default: false
  branch_strategy: enum   # "direct" | "pr"

integrations:
  github:
    enabled: boolean
    sync_issues: enum     # "none" | "import" | "bidirectional"
```

#### 6.2.3 Epic Schema (YAML)

```yaml
id: string                # Auto-generated: EP-001
title: string             # Required
status: enum              # "planning" | "in_progress" | "complete" | "cancelled"
owner: string             # Optional: @username
spec: string              # Optional: relative path to spec
priority: enum            # "p0" | "p1" | "p2" | "p3"
target_date: date         # Optional: YYYY-MM-DD
dependencies: [string]    # Optional: list of epic IDs
issues: [string]          # Optional: list of issue refs
acceptance_criteria: [string]  # Optional: list of criteria
labels: [string]          # Optional: free-form labels
created_at: datetime      # Auto-generated
updated_at: datetime      # Auto-updated
```

#### 6.2.4 Spec Schema (Markdown with Frontmatter)

```markdown
---
id: string                # Auto-generated: SPEC-001
title: string             # Required
epic: string              # Optional: epic ID
status: enum              # "draft" | "review" | "approved" | "implemented"
author: string            # Optional
reviewers: [string]       # Optional
created_at: datetime
updated_at: datetime
---

# {Title}

## Overview
[Content]

## Goals
[Content]

## Non-Goals
[Content]

## Detailed Design
[Content]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

#### 6.2.5 roadmap.yaml Schema

```yaml
schema_version: 1

milestones:
  - id: string            # e.g., "2026-Q1"
    name: string
    start_date: date
    end_date: date
    epics: [string]       # List of epic IDs
    status: enum          # "planned" | "in_progress" | "complete"
```

### 6.3 Web UI Features (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| Dashboard | Overview of project status | P0 |
| Roadmap View | Timeline visualization of milestones | P0 |
| Epic List | Table/cards of all epics | P0 |
| Spec Editor | Markdown editor with preview | P0 |
| AI Chat Panel | Natural language interface | P0 |
| Pending Commits | List of local commits to sync | P0 |
| File Explorer | Tree view of `.prodman/` | P0 |
| Search | Full-text search across artifacts | P1 |
| Diff Viewer | Show changes before commit | P1 |

### 6.4 AI Capabilities (MVP)

| Capability | Description | Priority |
|------------|-------------|----------|
| Context Loading | Read all `.prodman/` files into context | P0 |
| Natural Language Q&A | Answer questions about product | P0 |
| Provider Abstraction | Support OpenAI, Anthropic, Ollama | P0 |
| Streaming Responses | Stream AI responses in UI | P1 |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Requirement | Priority |
|--------|-------------|----------|
| CLI Startup | < 200ms to first output | P0 |
| UI Load | < 2s to interactive | P0 |
| Search | < 500ms for 1000 files | P1 |
| AI Response Start | < 1s to first token (API) | P1 |
| Binary Size | < 60MB (Bun compiled) | P0 |
| npm Package Size | < 5MB (without deps) | P1 |

### 7.2 Reliability

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Data Integrity | Never corrupt Git repo | P0 |
| Crash Recovery | Uncommitted changes preserved | P0 |
| Graceful Degradation | Work without AI if API unavailable | P0 |

### 7.3 Security

| Requirement | Description | Priority |
|-------------|-------------|----------|
| No Telemetry | Zero data sent to any server | P0 |
| Local Storage | All data in user's filesystem | P0 |
| API Key Safety | Keys stored in user config, not repo | P0 |
| No Auto-Update | Users control when to update | P1 |

### 7.4 Compatibility

| Platform | Support Level | Priority |
|----------|---------------|----------|
| macOS (ARM64) | Full | P0 |
| macOS (x86_64) | Full | P0 |
| Linux (x86_64) | Full | P0 |
| Linux (ARM64) | Full | P1 |
| Windows (x86_64) | Full | P1 |
| Windows (ARM64) | Best effort | P2 |

### 7.5 Accessibility

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Keyboard Navigation | All UI accessible via keyboard | P1 |
| Screen Reader | Semantic HTML, ARIA labels | P2 |
| Color Contrast | WCAG AA compliance | P2 |

---

## 8. Technical Architecture

### 8.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                git-prodman (TypeScript/Bun)             │
├─────────────────────────────────────────────────────────┤
│  CLI Layer (Commander.js + Clack)                       │
│  ├── Command parser                                     │
│  ├── Interactive prompts                                │
│  └── Styled output (chalk/picocolors)                   │
├─────────────────────────────────────────────────────────┤
│  HTTP Server (Hono) ──────┐                             │
│  ├── Static file serving  │                             │
│  ├── REST API endpoints   │── Bundled SPA               │
│  └── WebSocket (AI chat)  │   (React + Tailwind)        │
├─────────────────────────────────────────────────────────┤
│  Core Engine                                            │
│  ├── Schema Parser (yaml + gray-matter)                 │
│  ├── Git Operations (isomorphic-git)                    │
│  ├── Link Resolver (cross-references)                   │
│  ├── Search Index (minisearch)                          │
│  └── Commit Manager (auto-commit on save)               │
├─────────────────────────────────────────────────────────┤
│  AI Layer                                               │
│  ├── Provider Abstraction                               │
│  │   ├── OpenAI adapter (openai)                        │
│  │   ├── Anthropic adapter (@anthropic-ai/sdk)          │
│  │   └── Ollama adapter (ollama)                        │
│  ├── Context Builder (gather relevant files)            │
│  └── Response Streamer (SSE)                            │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | TypeScript 5.x | Type safety, same lang for CLI + UI |
| Runtime | Bun | Fast, built-in bundler, single binary |
| CLI Framework | Commander.js | Mature, widely used, declarative |
| CLI Prompts | @clack/prompts | Beautiful, modern terminal UI |
| HTTP Server | Hono | Lightweight, fast, Bun-native |
| Git | isomorphic-git | Pure JS, no native deps, well-maintained |
| YAML Parser | yaml | Full YAML 1.2 support |
| Frontmatter | gray-matter | Parse markdown frontmatter |
| Search | minisearch | Lightweight full-text search |
| Web UI | React + Tailwind | Shared components with CLI (Ink) |
| Build | Bun | Bundle + compile to single binary |
| Package Manager | Bun | Fast, npm-compatible |

### 8.3 Data Flow

```
User Action (UI/CLI)
        │
        ▼
┌───────────────┐
│ Command/API   │
│ Handler       │
└───────┬───────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐
│ Core Engine   │────▶│ Git (libgit2) │
│ (parse/       │     │ - read files  │
│  validate)    │     │ - commit      │
└───────┬───────┘     │ - push/pull   │
        │             └───────────────┘
        ▼
┌───────────────┐
│ Response      │
│ (JSON/render) │
└───────────────┘
```

### 8.4 File Watching (UI Mode)

```
.prodman/ directory
        │
        ▼
┌───────────────┐
│ File Watcher  │  (notify crate)
│ - debounce    │
│ - filter      │
└───────┬───────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐
│ Re-parse      │────▶│ WebSocket     │
│ Changed Files │     │ Push to UI    │
└───────────────┘     └───────────────┘
```

---

## 9. UI/UX Requirements

### 9.1 Design Principles

1. **Git-Aware**: Always show Git state (pending commits, sync status)
2. **Context-Rich**: AI panel has access to full project context
3. **Non-Destructive**: Every action is undoable via Git
4. **Keyboard-First**: Power users can navigate without mouse
5. **Offline-Ready**: UI works without network (except AI)

### 9.2 Key Screens

#### 9.2.1 Dashboard

**Purpose**: Overview of project status at a glance

**Elements**:
- Project name and description
- Quick stats (epics in progress, specs drafted, etc.)
- Recent activity (last 5 commits to `.prodman/`)
- Sync status indicator
- Quick actions (new epic, new spec, sync)

#### 9.2.2 Roadmap View

**Purpose**: Timeline visualization of milestones and epics

**Elements**:
- Horizontal timeline with quarters/months
- Milestones as swimlanes
- Epics as cards positioned by target date
- Progress indicators on each epic
- Click to open epic details

#### 9.2.3 Epic/Spec Editor

**Purpose**: Create and edit product artifacts

**Elements**:
- Split view: editor (left) + preview (right)
- Markdown toolbar (bold, headers, links, etc.)
- Frontmatter editor (form for YAML fields)
- Auto-save indicator
- Commit message preview

#### 9.2.4 AI Chat Panel

**Purpose**: Natural language interaction with product context

**Elements**:
- Chat history
- Input field with send button
- Streaming response display
- Context indicator (files loaded)
- Quick prompts (suggestions)

### 9.3 Visual Design

**Style**: Clean, professional, developer-friendly

**Color Palette**:
- Background: #0d1117 (dark) / #ffffff (light)
- Primary: #58a6ff (blue accent)
- Success: #3fb950
- Warning: #d29922
- Error: #f85149
- Text: #c9d1d9 (dark) / #24292f (light)

**Typography**:
- Headings: Inter or system sans-serif
- Body: Inter or system sans-serif
- Code/Monospace: JetBrains Mono or system mono

### 9.4 Responsive Design

| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column, collapsible sidebar |
| 768-1200px | Two column (sidebar + main) |
| > 1200px | Three column (sidebar + main + AI panel) |

---

## 10. MVP Scope

### 10.1 What's In (v1.0)

| Category | Features |
|----------|----------|
| **CLI** | init, config, epic/spec/issue/decision CRUD, sync, pull, status, search |
| **Web UI** | Dashboard, roadmap view, spec editor, AI chat, file explorer, pending commits |
| **AI** | Natural language Q&A, OpenAI/Anthropic/Ollama support |
| **Git** | Auto-commit on save, push, pull, basic conflict detection |
| **Export** | None (v1.1) |
| **Import** | None (v1.1) |

### 10.2 MVP User Journey

```
1. Install
   $ curl -fsSL https://git-prodman.dev/install.sh | sh

2. Initialize
   $ cd my-project
   $ prodman init
   > Created .prodman/ with template: standard

3. Configure AI
   $ prodman provider set anthropic
   $ export ANTHROPIC_API_KEY=sk-...

4. Create first epic
   $ prodman epic create "User Authentication"
   > Created: .prodman/epics/user-authentication.yaml

5. Launch UI
   $ prodman ui
   > 🚀 Running at http://localhost:3333

6. Edit in UI
   - Open spec editor
   - Write requirements
   - See auto-commit in pending changes

7. Sync to team
   - Click "Sync" button
   - Changes pushed to origin/main
```

### 10.3 Acceptance Criteria (MVP)

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | User can install with single curl command | Manual test |
| AC-2 | `prodman init` creates valid `.prodman/` structure | Unit test |
| AC-3 | Web UI loads and displays dashboard | E2E test |
| AC-4 | User can create epic via CLI and see in UI | Integration test |
| AC-5 | User can edit spec in UI and changes auto-commit | E2E test |
| AC-6 | AI chat responds using product context | Manual test |
| AC-7 | Sync pushes commits to remote | Integration test |
| AC-8 | Search returns relevant results | Unit test |
| AC-9 | Works offline except for AI | Manual test |
| AC-10 | Binary runs on macOS, Linux, Windows | CI matrix |

---

## 11. Out of Scope (v1.0)

| Feature | Reason | Target Version |
|---------|--------|----------------|
| Import from Jira/Linear/Notion | Complexity, MVP focus | v1.1 |
| Export to PDF/HTML/Slides | Nice-to-have, not core | v1.1 |
| Simple mode (hide Git) | UX polish | v1.1 |
| AI spec drafting | Requires prompt engineering | v1.1 |
| AI issue breakdown | Requires prompt engineering | v1.1 |
| Custom agents | Plugin system complexity | v1.2 |
| Multi-repo portfolio | Architecture change | v1.2 |
| GitHub Issues sync | Integration complexity | v1.2 |
| VS Code extension | Separate project | v1.2+ |

---

## 12. Dependencies & Risks

### 12.1 Technical Dependencies

| Dependency | Risk | Mitigation |
|------------|------|------------|
| libgit2 | Complexity, edge cases | Extensive testing, fallback to git CLI |
| AI Provider APIs | Rate limits, outages | Graceful degradation, caching |
| tantivy | Learning curve | Start simple, optimize later |
| WebSocket | Browser compatibility | Fallback to polling |

### 12.2 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Binary size > 30MB | Medium | Medium | Optimize dependencies, strip symbols |
| Git conflicts confuse users | High | Medium | Good UI, AI-assisted resolution |
| AI context too large | Medium | Low | Truncation, smart selection |
| Competing tool launched | Low | High | Move fast, community focus |
| Rust learning curve | Medium | Medium | Start with familiar patterns |

### 12.3 Assumptions

1. Users have Git installed and configured
2. Users have a remote repository (GitHub/GitLab/etc.)
3. Users willing to bring their own AI API keys
4. English-only for v1.0

---

## 13. Release Plan

### 13.1 Milestones

| Milestone | Duration | Deliverables |
|-----------|----------|--------------|
| M1: Foundation | Week 1-2 | CLI skeleton, init command, file parsing |
| M2: Core CRUD | Week 3-4 | Epic/spec/issue commands, Git operations |
| M3: Web UI | Week 5-6 | Dashboard, editor, AI chat panel |
| M4: Polish | Week 7-8 | Search, testing, documentation, launch prep |

### 13.2 Launch Checklist

- [ ] Binary builds for all platforms
- [ ] Install script tested on fresh machines
- [ ] README with quick start guide
- [ ] Demo video (2-3 minutes)
- [ ] Hacker News post drafted
- [ ] Discord server created
- [ ] GitHub repo public with MIT license
- [ ] Landing page at git-prodman.dev

### 13.3 Post-Launch

- Week 1-2: Bug fixes, community response
- Week 3-4: v1.0.1 patch release
- Week 5-8: v1.1 development (import/export, simple mode)

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **Epic** | Large feature or initiative containing multiple issues |
| **Spec** | Detailed product requirements document |
| **ADR** | Architectural Decision Record |
| **OKR** | Objectives and Key Results |
| **PRD** | Product Requirements Document |

### 14.2 References

- [Original idea document](../idea.md)
- [Claude Code PM](https://github.com/automazeio/ccpm) — inspiration
- [GitKraken Context Engineering](https://www.gitkraken.com/blog/the-context-engineering-framework-3-shifts-for-ai-powered-dev-teams)

### 14.3 Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-11 | Product Team | Initial draft |

---

*This PRD is a living document. Updates will be tracked via Git history.*
