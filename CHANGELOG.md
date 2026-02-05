# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-31

### Added

- **Core CLI Commands**
  - `prodman init` - Initialize `.prodman/` directory with product.yaml, roadmap.yaml, and config
  - `prodman epic create/list/show` - Create and manage epics
  - `prodman spec create/list/show` - Create and manage specs
  - `prodman issue create/list/show` - Create and manage issues
  - `prodman decision create/list` - Create and manage Architecture Decision Records (ADRs)
  - `prodman roadmap` - View project roadmap
  - `prodman status` - Show project overview
  - `prodman search` - Full-text search across all artifacts
  - `prodman config` - Configure AI providers and settings

- **Web UI**
  - Bundled web interface at `prodman ui`
  - Dashboard with project stats and Git status
  - Roadmap timeline view
  - Epics table with status badges
  - Kanban board with drag-and-drop
  - Split-pane Markdown editor for specs
  - File tree explorer
  - AI chat interface with streaming responses
  - Dark/Light mode support

- **AI Integration**
  - OpenAI support (GPT-4o, GPT-4, GPT-3.5)
  - Anthropic Claude support (Claude 3.5 Sonnet)
  - Ollama support for local models
  - Natural language queries with `prodman ask`
  - Context-aware responses using product artifacts

- **Git-Native Storage**
  - All artifacts stored as YAML/Markdown files
  - Automatic commits on changes
  - Git sync operations (push, pull, diff)
  - Merge conflict detection and resolution

- **Schema Validation**
  - Zod-based validation for all artifact types
  - Epic, Spec, Issue, Decision schemas
  - Product and Roadmap configuration schemas

### Technical

- TypeScript with ES Modules
- Hono-based web server
- isomorphic-git for Git operations
- MiniSearch for full-text search
- Commander.js for CLI parsing
- Clack prompts for interactive CLI
