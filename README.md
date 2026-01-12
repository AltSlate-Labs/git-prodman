<p align="center">
  <h1 align="center">⚡ git-prodman</h1>
  <p align="center">
    <strong>Product management that lives in your Git repo</strong>
  </p>
  <p align="center">
    Local-first · AI-native · MIT licensed
  </p>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#commands">Commands</a> •
  <a href="#web-ui">Web UI</a> •
  <a href="#ai-integration">AI</a> •
  <a href="#philosophy">Philosophy</a>
</p>

---

**git-prodman** is a CLI tool that brings product management into your Git repository. PRDs, specs, epics, decisions—all stored as version-controlled YAML and Markdown files. No SaaS, no accounts, no cloud sync. Just Git.

## Why?

- **Context fragmentation kills products.** Specs in Notion, tasks in Jira, decisions in Slack, code in GitHub. git-prodman puts everything in one place: your repo.
- **Git is the best database** for versioned, collaborative documents. Every edit creates a commit. Every merge is a sync.
- **AI works better with context.** When your product artifacts live alongside your code, AI assistants can understand the full picture.

## Features

- 📝 **Specs & Epics** — YAML + Markdown files with schema validation
- 🗺️ **Roadmap** — Timeline view of milestones and releases  
- 🤖 **AI Assistant** — Query your product with natural language (OpenAI, Anthropic, Ollama)
- 🌐 **Bundled Web UI** — Visual editor served locally, no separate install
- 🔀 **Git-Native** — Every save is a commit, sync when ready
- 🔍 **Full-Text Search** — Find anything across all artifacts
- 🌙 **Dark/Light Mode** — Easy on the eyes

## Installation

### npm (recommended)

```bash
npm install -g git-prodman
```

### From source

```bash
git clone https://github.com/git-prodman/git-prodman.git
cd git-prodman
npm install
npm run build
npm link
```

### Standalone binary

Download from [Releases](https://github.com/git-prodman/git-prodman/releases):

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `prodman-macos-arm64` |
| macOS (Intel) | `prodman-macos-x64` |
| Linux (x64) | `prodman-linux-x64` |
| Windows (x64) | `prodman-win-x64.exe` |

## Quick Start

```bash
# Initialize in your project
cd your-project
prodman init

# Create your first epic
prodman epic create

# Start the web UI
prodman ui
```

This creates a `.prodman/` directory:

```
.prodman/
├── product.yaml      # Product vision & OKRs
├── roadmap.yaml      # Milestones & releases
├── config.yaml       # Project settings
├── epics/            # Epic YAML files
├── specs/            # Spec Markdown files
├── issues/           # Issue tracking
├── decisions/        # Architecture Decision Records
└── templates/        # Templates for new artifacts
```

## Commands

### Core Commands

```bash
prodman init              # Initialize .prodman/ in current repo
prodman ui [--port 3333]  # Start web UI
prodman status            # Show project overview
```

### Artifact Management

```bash
# Epics
prodman epic create       # Create new epic (interactive)
prodman epic list         # List all epics
prodman epic show EP-001  # Show epic details

# Specs
prodman spec create       # Create new spec
prodman spec list         # List all specs
prodman spec show SP-001  # Show spec details

# Issues
prodman issue create      # Create new issue
prodman issue list        # List all issues

# Decisions (ADRs)
prodman decision create   # Create new ADR
prodman decision list     # List all decisions
```

### Git Operations

```bash
prodman sync              # Push commits to remote
prodman pull              # Pull with conflict detection
prodman diff              # Show uncommitted changes
prodman conflicts         # List files with merge conflicts
prodman resolve <file>    # Resolve merge conflicts
```

### Search & AI

```bash
prodman search "auth"              # Full-text search
prodman ask "What's our MVP scope?" # AI query
prodman "summarize the roadmap"    # Bare AI query
```

### Configuration

```bash
prodman config show       # Show current config
prodman config set        # Interactive configuration
prodman config path       # Show config file location
```

## Web UI

Start the bundled web interface:

```bash
prodman ui
```

Opens `http://localhost:3333` with:

- **Dashboard** — Project stats, Git status, recent activity
- **Roadmap** — Timeline view of milestones
- **Epics** — Table view with status badges
- **Specs** — List + split-pane Markdown editor
- **Files** — Tree explorer for `.prodman/` directory
- **AI** — Chat interface with streaming responses

### Screenshots

<details>
<summary>Dashboard (Dark Mode)</summary>

The dashboard shows project stats, Git status, and recent epics.
</details>

<details>
<summary>File Explorer (Light Mode)</summary>

Browse and view all `.prodman/` files in a tree structure.
</details>

## AI Integration

git-prodman supports multiple AI providers:

### OpenAI

```bash
prodman config set
# Select: openai
# Enter API key: sk-...
# Model: gpt-4o (default)
```

### Anthropic (Claude)

```bash
prodman config set
# Select: anthropic  
# Enter API key: sk-ant-...
# Model: claude-3-5-sonnet-20241022 (default)
```

### Ollama (Local)

```bash
# Start Ollama first
ollama serve

prodman config set
# Select: ollama
# Endpoint: http://localhost:11434 (default)
# Model: llama3.2 (default)
```

### Usage

```bash
# CLI queries
prodman ask "What are our P0 epics?"
prodman "How should we approach the auth system?"

# Web UI
# Click the 🤖 AI tab and chat directly
```

## Philosophy

### Git is the Database

No external database. No sync service. Your Git repo IS the source of truth. This means:

- **Version history for free** — Every change is a commit
- **Collaboration via Git** — PRs, branches, merge conflicts
- **Backup = push** — Your remote is your backup
- **Works offline** — No internet required

### Local-First

- All data stays on your machine
- No telemetry, no analytics, no tracking
- No user accounts or authentication
- Works in air-gapped environments

### AI-Optional

- Full functionality without AI
- Bring your own API keys
- Support for local models (Ollama)
- Context stays private

### MIT Licensed

- 100% open source
- Fork it, modify it, sell it
- No "open core" upselling
- Community-driven development

## File Formats

### Epic (YAML)

```yaml
id: EP-001
title: "User Authentication"
status: in_progress  # planning | in_progress | complete | cancelled
priority: p0         # p0 | p1 | p2 | p3
owner: "@alice"
milestone: v1.0-mvp

description: |
  Implement secure user authentication with OAuth2 support.

acceptance_criteria:
  - "[ ] Login with email/password"
  - "[ ] OAuth2 (Google, GitHub)"
  - "[x] Password reset flow"

progress: 60
```

### Spec (Markdown + Frontmatter)

```markdown
---
id: SP-001
title: "Auth API Design"
status: draft  # draft | review | approved | implemented
epic: EP-001
author: "@bob"
---

# Auth API Design

## Overview

This spec describes the authentication API endpoints...
```

## Development

```bash
# Clone
git clone https://github.com/git-prodman/git-prodman.git
cd git-prodman

# Install dependencies
npm install

# Run in development
npm run dev -- --help
npm run dev -- ui

# Build
npm run build

# Type check
npm run typecheck

# Build standalone binaries
npm run pkg
```

## Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) — Use it however you want.

---

<p align="center">
  Made with ❤️ for product people who love Git
</p>
