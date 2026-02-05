# Architecture

This document describes the technical architecture of git-prodman.

## Overview

git-prodman is a TypeScript CLI application with a bundled web UI. It reads and writes product management artifacts stored as YAML and Markdown files in a `.prodman/` directory within a Git repository.

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
                      ▼                   ▼
              ┌───────────────┐   ┌───────────────┐
              │   CLI (tsx)   │   │   Web UI      │
              │  Commander.js │   │  Alpine.js    │
              │  @clack/prompts│  │  Tailwind     │
              └───────┬───────┘   └───────┬───────┘
                      │                   │
                      ▼                   ▼
              ┌─────────────────────────────────────┐
              │           Hono HTTP Server          │
              │         (embedded in CLI)           │
              └─────────────────┬───────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │            Core Layer               │
              │  ┌─────────┐ ┌─────────┐ ┌───────┐ │
              │  │   fs    │ │   git   │ │schemas│ │
              │  └─────────┘ └─────────┘ └───────┘ │
              └─────────────────┬───────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │         .prodman/ Directory         │
              │  YAML + Markdown files in Git repo  │
              └─────────────────────────────────────┘
```

## Directory Structure

```
src/
├── cli/
│   ├── index.ts           # Entry point, Commander setup
│   └── commands/
│       ├── init.ts        # prodman init
│       ├── ui.ts          # Web server + HTML generation
│       ├── epic.ts        # Epic CRUD
│       ├── spec.ts        # Spec CRUD
│       ├── issue.ts       # Issue CRUD
│       ├── decision.ts    # ADR CRUD
│       ├── journey.ts     # User Journey CRUD
│       ├── sync.ts        # Git push/pull/resolve
│       ├── diff.ts        # Show uncommitted changes
│       ├── status.ts      # Project overview
│       ├── search.ts      # Full-text search
│       ├── config.ts      # Configuration management
│       └── ask.ts         # AI queries
├── core/
│   ├── constants.ts       # Shared constants, enums
│   ├── fs.ts              # File system operations
│   ├── git.ts             # Git operations
│   └── schemas/
│       ├── config.ts      # Config schema (Zod)
│       ├── epic.ts        # Epic schema
│       ├── spec.ts        # Spec schema
│       ├── issue.ts       # Issue schema
│       ├── decision.ts    # Decision schema
│       └── journey.ts     # Journey schema
└── web/                   # (Reserved for future React build)
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Language | TypeScript 5.x | Type safety, modern JS |
| Runtime | Node.js 18+ | Cross-platform, async I/O |
| CLI Framework | Commander.js | Command parsing, help generation |
| CLI Prompts | @clack/prompts | Beautiful interactive prompts |
| Web Server | Hono | Fast, lightweight HTTP server |
| Web UI | Alpine.js + Tailwind | Reactive UI without build step |
| Git | isomorphic-git | Pure JS Git implementation |
| YAML | yaml | YAML parsing/serialization |
| Markdown | gray-matter | Frontmatter extraction |
| Search | MiniSearch | Full-text search index |
| Validation | Zod | Runtime type validation |
| AI (OpenAI) | openai | GPT API client |
| AI (Anthropic) | @anthropic-ai/sdk | Claude API client |
| AI (Local) | ollama | Local LLM support |

## Data Flow

### Reading Artifacts

```
User Request
    │
    ▼
┌─────────────────────┐
│  CLI Command or     │
│  Web API Request    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   core/fs.ts        │
│   - findProdmanRoot │
│   - readEpics()     │
│   - readSpecs()     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  File System        │
│  - Read YAML/MD     │
│  - Parse frontmatter│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Zod Validation     │
│  - Schema check     │
│  - Type coercion    │
└──────────┬──────────┘
           │
           ▼
   Typed Data Object
```

### Writing Artifacts (with Auto-Commit)

```
User Edit (Web UI)
    │
    ▼
┌─────────────────────┐
│  PUT /api/specs/:id │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  core/fs.ts         │
│  - writeSpec()      │
│  - Serialize YAML   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  File System        │
│  - Write to disk    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  core/git.ts        │
│  - stageFile()      │
│  - commit()         │
└──────────┬──────────┘
           │
           ▼
   Local Git Commit
```

## Web UI Architecture

The web UI is server-rendered HTML with client-side interactivity via Alpine.js.

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Alpine.js App                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │Dashboard│ │ Roadmap │ │  Epics  │ │  Specs  │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │Journeys │ │ Kanban  │ │  Files  │ │   AI    │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ fetch()
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hono Server                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   API Routes                         │   │
│  │  GET  /api/epics         GET  /api/specs            │   │
│  │  GET  /api/issues        GET  /api/journeys         │   │
│  │  GET  /api/roadmap       GET  /api/git/status       │   │
│  │  PUT  /api/specs/:id     PUT  /api/journeys/:id     │   │
│  │  PUT  /api/epics/:id     PUT  /api/issues/:id       │   │
│  │  POST /api/chat          GET  /api/files            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              HTML Generation                         │   │
│  │  getDashboardHTML() - Server-rendered initial state │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **No build step for UI** — HTML is generated in TypeScript, no webpack/vite
2. **Alpine.js over React** — Smaller bundle, simpler for this use case
3. **Tailwind via CDN** — No CSS build process needed
4. **Server-Sent Events for AI** — Streaming responses without WebSocket complexity

## Git Integration

### Commit-per-Change Model

Every save in the Web UI creates a Git commit:

```typescript
// In ui.ts PUT /api/specs/:id handler
const filepath = writeSpec(root, updated);
const msg = generateCommitMessage(relPath, "update");
commitChange(root, relPath, msg);  // git add + git commit
```

### Conflict Detection

On `prodman pull`, we detect merge conflicts:

```typescript
// In git.ts
export async function pullWithConflictDetection(root: string) {
  execSync("git pull", { cwd: root });
  const conflicts = getConflicts(root);  // git diff --name-only --diff-filter=U
  return { success: conflicts.length === 0, conflicts };
}
```

### Git CLI vs isomorphic-git

Currently using a hybrid approach:

| Operation | Implementation |
|-----------|----------------|
| status, add, commit | git CLI (execSync) |
| Async operations | isomorphic-git |
| push, pull | git CLI (stdio: inherit) |

Future: Migrate fully to isomorphic-git for portability.

## AI Integration

### Provider Abstraction

```typescript
async function streamAIResponse(config, query, context, onChunk) {
  switch (config.ai?.provider) {
    case "anthropic":
      // Use @anthropic-ai/sdk
      break;
    case "openai":
      // Use openai package
      break;
    case "ollama":
      // Direct HTTP to localhost:11434
      break;
  }
}
```

### Context Building

AI queries include project context:

```typescript
async function buildContext(root: string): Promise<string> {
  const parts = [];
  
  // Include product.yaml
  parts.push("## Product\n" + readFile("product.yaml"));
  
  // Include roadmap
  parts.push("## Roadmap\n" + readFile("roadmap.yaml"));
  
  // Summarize epics and specs
  parts.push("## Epics\n" + epics.map(e => `- ${e.id}: ${e.title}`));
  
  return parts.join("\n\n");
}
```

## Schema Validation

All artifacts are validated with Zod schemas:

```typescript
// schemas/epic.ts
export const EpicSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["planning", "in_progress", "complete", "cancelled"]),
  priority: z.enum(["p0", "p1", "p2", "p3"]),
  // ...
});

// On read
const parsed = EpicSchema.safeParse(yaml);
if (!parsed.success) {
  console.error("Invalid epic:", parsed.error);
}
```

## File Formats

### .prodman/ Structure

```
.prodman/
├── product.yaml        # Product vision, OKRs, target users
├── roadmap.yaml        # Milestones, releases, timeline
├── config.yaml         # Project-level settings
├── epics/
│   └── EP-001-*.yaml   # Epic definitions
├── specs/
│   └── *.md            # Spec documents (frontmatter + markdown)
├── issues/
│   └── ISS-001-*.yaml  # Issue tracking
├── decisions/
│   └── DEC-001-*.md    # Architecture Decision Records
├── journeys/
│   └── UJ-001-*.md     # User Journey maps
└── templates/          # Templates for new artifacts
```

### Epic YAML Schema

```yaml
id: EP-001                    # Unique identifier
title: "Feature Name"         # Display title
status: in_progress           # planning|in_progress|complete|cancelled
priority: p0                  # p0|p1|p2|p3
owner: "@username"            # Optional assignee
milestone: v1.0-mvp           # Associated milestone
description: |                # Multi-line description
  Detailed description here.
acceptance_criteria:          # Checklist items
  - "[ ] Criterion 1"
  - "[x] Criterion 2 (done)"
progress: 60                  # 0-100 percentage
dependencies:                 # Other epic IDs
  - EP-002
labels:                       # Tags
  - backend
  - auth
```

### Spec Markdown Schema

```markdown
---
id: SP-001
title: "Spec Title"
status: draft                 # draft|review|approved|implemented
epic: EP-001                  # Parent epic
author: "@username"
created_at: 2026-01-11
updated_at: 2026-01-11
---

# Spec Title

Markdown content goes here...
```

### Journey Markdown Schema

```markdown
---
id: UJ-001
title: "Journey Title"
persona: "target-user-id"     # References target_users.id in product.yaml
goal: "What the user wants"
status: draft                 # draft|validated|implemented|deprecated
priority: p1                  # p0|p1|p2|p3
steps:
  - order: 1
    action: "User does something"
    touchpoint: cli           # cli|web-ui|docs|api|external|notification
    emotion: neutral          # frustrated|confused|neutral|satisfied|delighted
    pain_points: []           # Array of friction points
    opportunities: []         # Array of improvement ideas
epics:                        # Linked epic IDs
  - EP-001
related_journeys: []          # Related journey IDs
author: "@username"
created_at: 2026-01-11
updated_at: 2026-01-11
---

# Journey Title

Additional context and notes in markdown...
```

## Configuration

### User Config (~/.config/prodman/config.yaml)

```yaml
ai:
  provider: anthropic         # openai|anthropic|ollama
  api_key: sk-ant-...         # API key (not stored in repo!)
  model: claude-3-5-sonnet-20241022
  
defaults:
  author: "@username"
```

### Project Config (.prodman/config.yaml)

```yaml
project:
  name: "My Project"
  
sync:
  strategy: manual            # manual|auto
  
integrations:
  github: null                # Future: issue sync
```

## Performance Considerations

1. **Lazy loading** — Only read files when needed
2. **Caching** — MiniSearch index built once per session
3. **Streaming** — AI responses streamed via SSE
4. **No framework overhead** — Alpine.js is 15KB gzipped

## Security

1. **No network by default** — All operations are local
2. **API keys in user config** — Never stored in repo
3. **Git credentials** — Uses system git credential helper
4. **No eval()** — YAML parsed safely

## Future Considerations

- **React Web UI** — For more complex interactions
- **Plugin system** — Custom commands and integrations
- **Watch mode** — Auto-reload on file changes
- **Real-time collaboration** — WebSocket-based (optional)

---

See [README.md](README.md) for usage instructions.
