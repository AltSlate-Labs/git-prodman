import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import YAML from "yaml";
import { PRODMAN_DIR, PRODMAN_DIRS, PRODMAN_FILES } from "../../core/constants.js";
import type { RepoConfig } from "../../core/schemas/config.js";

export const initCommand = new Command("init")
  .description("Initialize .prodman/ in the current repository")
  .option("-n, --name <name>", "Project name")
  .option("-t, --template <template>", "Template: minimal, standard, opensource")
  .option("-y, --yes", "Skip prompts, use defaults")
  .action(async (options) => {
    const cwd = process.cwd();

    // Check if already initialized
    if (existsSync(join(cwd, PRODMAN_DIR))) {
      p.log.warn(
        pc.yellow(`${PRODMAN_DIR}/ already exists in this directory.`)
      );
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
      const answers = await p.group(
        {
          name: () =>
            p.text({
              message: "Project name",
              placeholder: "my-awesome-product",
              defaultValue: projectName || getDefaultProjectName(cwd),
              validate: (v) => (v.length === 0 ? "Name is required" : undefined),
            }),
          template: () =>
            p.select({
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
        },
        {
          onCancel: () => {
            p.cancel("Cancelled.");
            process.exit(0);
          },
        }
      );

      projectName = answers.name as string;
      template = answers.template as string;
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
      const config: RepoConfig = {
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
        },
      };

      writeFileSync(
        join(cwd, PRODMAN_DIR, PRODMAN_FILES.config),
        `# git-prodman Repository Configuration\n` + YAML.stringify(config),
        "utf-8"
      );

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

      writeFileSync(
        join(cwd, PRODMAN_DIR, PRODMAN_FILES.product),
        `# Product Definition\n` + YAML.stringify(product),
        "utf-8"
      );

      // Create roadmap.yaml
      const roadmap = {
        schema_version: 1,
        milestones: [],
        releases: [],
        updated_at: new Date().toISOString().split("T")[0],
      };

      writeFileSync(
        join(cwd, PRODMAN_DIR, PRODMAN_FILES.roadmap),
        `# Product Roadmap\n` + YAML.stringify(roadmap),
        "utf-8"
      );

      // Create templates if standard or opensource
      if (template !== "minimal") {
        createTemplates(join(cwd, PRODMAN_DIR, PRODMAN_DIRS.templates));
      }

      s.stop(pc.green("Created .prodman/ structure"));

      // Summary
      p.note(
        [
          `${pc.dim("├──")} ${PRODMAN_FILES.config}`,
          `${pc.dim("├──")} ${PRODMAN_FILES.product}`,
          `${pc.dim("├──")} ${PRODMAN_FILES.roadmap}`,
          template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.epics}/` : null,
          template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.specs}/` : null,
          template !== "minimal" ? `${pc.dim("├──")} ${PRODMAN_DIRS.decisions}/` : null,
          template !== "minimal" ? `${pc.dim("└──")} ${PRODMAN_DIRS.templates}/` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        `Created in ${PRODMAN_DIR}/`
      );

      p.outro(
        pc.green("✓ ") +
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
          " to start the web interface"
      );
    } catch (error) {
      s.stop(pc.red("Failed to create structure"));
      p.log.error(String(error));
      process.exit(1);
    }
  });

function getDefaultProjectName(cwd: string): string {
  return cwd.split("/").pop() || "my-project";
}

function createTemplates(templatesDir: string): void {
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
