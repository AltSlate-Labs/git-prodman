import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import YAML from "yaml";
import { PRODMAN_DIR, PRODMAN_DIRS, PRODMAN_FILES } from "../../core/constants.js";
const AGENTS_MD_CONTENT = `# Agent Instructions

Instructions for AI agents working on this project.

## Development Workflow

### Work Epic by Epic

1. **Check current epic** - Read \`.prodman/roadmap.yaml\` to identify the current milestone and its epics
2. **Read epic details** - Load the epic file from \`.prodman/epics/EPIC-XXX.yaml\`
3. **Read related specs** - Load specs referenced in the epic from \`.prodman/specs/\`
4. **Implement** - Build the feature according to acceptance criteria
5. **Verify** - Test against ALL acceptance criteria in the epic
6. **Update status** - Mark epic as complete in \`.prodman/\`
7. **Log issues** - Document any blockers or bugs found
8. **Move to next epic** - Only after current epic is verified

### Epic Dependencies

Always check the \`dependencies\` field in each epic. Never start an epic until all its dependencies are \`complete\`.

---

## Prodman Structure

The \`.prodman/\` directory contains all product management artifacts:

\`\`\`
.prodman/
├── config.yaml      # Project config and counters
├── product.yaml     # Product definition, vision, target users
├── roadmap.yaml     # Milestones and releases
├── epics/           # Feature epics (EP-XXX.yaml)
├── specs/           # Technical specifications (SPEC-XXX.md)
├── issues/          # Bug reports and issues (ISS-XXX.yaml)
├── decisions/       # Architecture Decision Records (DEC-XXX.md)
├── journeys/        # User Journey maps (UJ-XXX.md)
└── templates/       # Templates for new artifacts
\`\`\`

### Key Files

| File | Purpose | When to Read |
|------|---------|--------------|
| \`product.yaml\` | Product vision, principles, target users | Understanding context |
| \`roadmap.yaml\` | Current milestone, epic order | Start of work |
| \`epics/EP-XXX.yaml\` | Feature requirements, acceptance criteria | Before implementing |
| \`specs/SPEC-XXX.md\` | Technical design, API details | During implementation |
| \`decisions/DEC-XXX.md\` | Architecture choices made | When making tech decisions |
| \`journeys/UJ-XXX.md\` | User journey maps, steps, emotions | Understanding user experience |

---

## Verification

After completing an epic, verify ALL acceptance criteria before marking complete.

1. Read the \`acceptance_criteria\` list in the epic file
2. Test each criterion manually or via automated tests
3. Only mark \`status: complete\` when ALL criteria pass
4. If any criterion fails, log an issue and keep status as \`in_progress\`

---

## Proactive Issue Logging

**When you discover a bug or issue during development or testing, ALWAYS log it to \`.prodman/issues/\` immediately.**

This ensures issues are tracked even if they are not immediately fixed. Follow this process:

1. **Identify** - Notice unexpected behavior, visual bugs, or functionality issues
2. **Document** - Create an issue file following the template in \`.prodman/templates/\`
3. **Increment counter** - Update \`counters.issue\` in \`.prodman/config.yaml\`
4. **Reference** - Link to the related epic if applicable
5. **Continue or Fix** - Either fix immediately or continue with current work

### When to Log Issues

- Visual bugs (broken images, misaligned elements, missing styles)
- Functional bugs (features not working as specified)
- Edge cases discovered during testing
- Performance problems
- Missing error handling
- Platform-specific issues

**Do not skip issue logging** - even if you plan to fix immediately, the issue record provides valuable documentation.

---

## Updating Status in .prodman/

### When Starting an Epic

Edit \`.prodman/epics/EP-XXX.yaml\`:
\`\`\`yaml
status: in_progress  # was: planned
updated_at: "YYYY-MM-DD"
\`\`\`

### When Completing an Epic

Edit \`.prodman/epics/EP-XXX.yaml\`:
\`\`\`yaml
status: complete  # was: in_progress
updated_at: "YYYY-MM-DD"
\`\`\`

### Status Values

| Status | Meaning |
|--------|---------|
| \`planned\` | Not yet started |
| \`planning\` | Being designed/scoped |
| \`in_progress\` | Currently being implemented |
| \`complete\` | Done and verified |
| \`cancelled\` | Decided not to implement |

---

## Logging Issues

When you encounter bugs, blockers, or unexpected behavior, create an issue file.

### Create Issue File

1. Get next issue number from \`.prodman/config.yaml\` → \`counters.issue\`
2. Increment the counter in \`config.yaml\`
3. Create \`.prodman/issues/ISS-XXX-slug.yaml\`

### Issue Template

\`\`\`yaml
id: "ISS-XXX"
title: "Brief description"
type: bug  # bug | feature | task | improvement
status: planned
priority: p1  # p0=critical, p1=high, p2=medium, p3=low
epic: "EP-XXX"  # Related epic, if any
description: |
  Detailed description of the issue.
assignee: null
reporter: null
labels: []
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
\`\`\`

### Issue Status Values

| Status | Meaning |
| Status | Meaning |
| \`planned\` | Newly created |
| \`planning\` | Being scoped |
| \`in_progress\` | Being worked on |
| \`complete\` | Fixed and verified |
| \`cancelled\` | Decided not to address |

---

## Quick Reference

### Before Starting Work
\`\`\`bash
cat .prodman/roadmap.yaml        # Check milestones
cat .prodman/epics/EP-XXX.yaml   # Read current epic
cat .prodman/specs/SPEC-XXX.md   # Read related spec
\`\`\`

### After Completing Work
1. Verify all acceptance criteria pass
2. Update epic status to \`complete\`
3. Log any issues discovered
4. Check for next epic in roadmap
`;
export const initCommand = new Command("init")
    .description("Initialize .prodman/ in the current repository")
    .option("-n, --name <name>", "Project name")
    .option("-t, --template <template>", "Template: minimal, standard, opensource")
    .option("-y, --yes", "Skip prompts, use defaults")
    .action(async (options) => {
    const cwd = process.cwd();
    // Check if already initialized
    if (existsSync(join(cwd, PRODMAN_DIR))) {
        p.log.warn(pc.yellow(`${PRODMAN_DIR}/ already exists in this directory.`));
        const shouldContinue = await p.confirm({
            message: "Reinitialize? This may overwrite existing files.",
            initialValue: false,
        });
        if (!shouldContinue || p.isCancel(shouldContinue)) {
            p.outro("Cancelled.");
            return;
        }
    }
    p.intro(pc.bgCyan(pc.black(" git-prodman init ")));
    let projectName = options.name;
    let template = options.template || "standard";
    if (!options.yes) {
        // Interactive prompts
        const answers = await p.group({
            name: () => p.text({
                message: "Project name",
                placeholder: "my-awesome-product",
                defaultValue: projectName || getDefaultProjectName(cwd),
                validate: (v) => (v.length === 0 ? "Name is required" : undefined),
            }),
            template: () => p.select({
                message: "Choose a template",
                options: [
                    {
                        value: "minimal",
                        label: "Minimal",
                        hint: "Just product.yaml + roadmap.yaml",
                    },
                    {
                        value: "standard",
                        label: "Standard",
                        hint: "Includes epics/, specs/, decisions/",
                    },
                    {
                        value: "opensource",
                        label: "Open Source",
                        hint: "Standard + CONTRIBUTING integration",
                    },
                ],
                initialValue: template,
            }),
        }, {
            onCancel: () => {
                p.cancel("Cancelled.");
                process.exit(0);
            },
        });
        projectName = answers.name;
        template = answers.template;
    }
    projectName = projectName || getDefaultProjectName(cwd);
    const s = p.spinner();
    s.start("Creating .prodman/ structure...");
    try {
        // Create directory structure
        mkdirSync(join(cwd, PRODMAN_DIR), { recursive: true });
        if (template !== "minimal") {
            for (const dir of Object.values(PRODMAN_DIRS)) {
                mkdirSync(join(cwd, PRODMAN_DIR, dir), { recursive: true });
            }
        }
        // Create config.yaml
        const config = {
            schema_version: 1,
            project: {
                name: projectName,
                description: "",
                default_branch: "main",
            },
            sync: {
                remote: "origin",
                auto_push: false,
                branch_strategy: "direct",
            },
            counters: {
                epic: 0,
                spec: 0,
                decision: 0,
                issue: 0,
                journey: 0,
            },
        };
        writeFileSync(join(cwd, PRODMAN_DIR, PRODMAN_FILES.config), `# git-prodman Repository Configuration\n` + YAML.stringify(config), "utf-8");
        // Create product.yaml
        const product = {
            schema_version: 1,
            name: projectName,
            tagline: "",
            description: "Add your product description here.",
            vision: "",
            principles: [],
            okrs: [],
            target_users: [],
            created_at: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString().split("T")[0],
        };
        writeFileSync(join(cwd, PRODMAN_DIR, PRODMAN_FILES.product), `# Product Definition\n` + YAML.stringify(product), "utf-8");
        // Create roadmap.yaml
        const roadmap = {
            schema_version: 1,
            milestones: [],
            releases: [],
            updated_at: new Date().toISOString().split("T")[0],
        };
        writeFileSync(join(cwd, PRODMAN_DIR, PRODMAN_FILES.roadmap), `# Product Roadmap\n` + YAML.stringify(roadmap), "utf-8");
        // Create AGENTS.md at project root (only if it doesn't exist)
        const agentsMdPath = join(cwd, "AGENTS.md");
        const createdAgentsMd = !existsSync(agentsMdPath);
        if (createdAgentsMd) {
            writeFileSync(agentsMdPath, AGENTS_MD_CONTENT, "utf-8");
        }
        // Create templates if standard or opensource
        if (template !== "minimal") {
            createTemplates(join(cwd, PRODMAN_DIR, PRODMAN_DIRS.templates));
        }
        s.stop(pc.green("Created .prodman/ structure"));
        // Summary
        p.note([
            `${pc.dim("├──")} ${PRODMAN_FILES.config}`,
            `${pc.dim("├──")} ${PRODMAN_FILES.product}`,
            `${pc.dim("├──")} ${PRODMAN_FILES.roadmap}`,
            template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.epics}/` : null,
            template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.specs}/` : null,
            template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.issues}/` : null,
            template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.decisions}/` : null,
            template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.journeys}/` : null,
            template !== "minimal" ? `${pc.dim("└──")} ${PRODMAN_DIRS.templates}/` : null,
        ]
            .filter(Boolean)
            .join("\n"), `Created in ${PRODMAN_DIR}/`);
        // Note about AGENTS.md
        if (createdAgentsMd) {
            p.log.info(`${pc.cyan("AGENTS.md")} created at project root (AI agent instructions)`);
        }
        p.outro(pc.green("✓ ") +
            "Initialized! Next steps:\n\n" +
            pc.dim("  1. ") +
            "Edit " +
            pc.cyan(".prodman/product.yaml") +
            " to define your product\n" +
            pc.dim("  2. ") +
            "Run " +
            pc.cyan("prodman epic create 'First Epic'") +
            " to create an epic\n" +
            pc.dim("  3. ") +
            "Run " +
            pc.cyan("prodman ui") +
            " to start the web interface");
    }
    catch (error) {
        s.stop(pc.red("Failed to create structure"));
        p.log.error(String(error));
        process.exit(1);
    }
});
function getDefaultProjectName(cwd) {
    return cwd.split("/").pop() || "my-project";
}
function createTemplates(templatesDir) {
    mkdirSync(templatesDir, { recursive: true });
    // Epic template
    const epicTemplate = `# Epic Template
id: "{{ID}}"
title: "{{TITLE}}"
status: planning
priority: p1
owner: null
milestone: null
spec: null
description: |
  [Describe the epic here]
acceptance_criteria:
  - "[Criterion 1]"
  - "[Criterion 2]"
dependencies: []
issues: []
labels: []
target_date: null
created_at: "{{CREATED_AT}}"
updated_at: "{{CREATED_AT}}"
`;
    writeFileSync(join(templatesDir, "epic.yaml"), epicTemplate, "utf-8");
    // Spec template
    const specTemplate = `---
id: "{{ID}}"
title: "{{TITLE}}"
epic: null
status: draft
author: null
reviewers: []
created_at: "{{CREATED_AT}}"
updated_at: "{{CREATED_AT}}"
---

# {{TITLE}}

## Overview

[Brief overview]

## Problem Statement

[What problem does this solve?]

## Goals

- [Goal 1]
- [Goal 2]

## Non-Goals

- [Out of scope]

## Detailed Design

[Details]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Open Questions

- [ ] [Question 1]
`;
    writeFileSync(join(templatesDir, "spec.md"), specTemplate, "utf-8");
    // Decision (ADR) template
    const decisionTemplate = `---
id: "{{ID}}"
title: "{{TITLE}}"
status: proposed
date: "{{CREATED_AT}}"
decision_makers: []
---

# {{ID}}: {{TITLE}}

## Status

**Proposed** — {{CREATED_AT}}

## Context

[What is the issue?]

## Decision Drivers

- [Driver 1]
- [Driver 2]

## Considered Options

### Option 1: [Name]

**Pros:** [List]
**Cons:** [List]

### Option 2: [Name]

**Pros:** [List]
**Cons:** [List]

## Decision

[Which option and why]

## Consequences

- [Positive/negative consequences]
`;
    writeFileSync(join(templatesDir, "decision.md"), decisionTemplate, "utf-8");
}
