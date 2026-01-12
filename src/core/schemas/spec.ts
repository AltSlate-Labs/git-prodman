import { z } from "zod";
import { SPEC_STATUSES } from "../constants.js";

// Frontmatter schema for spec markdown files
export const SpecFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  epic: z.string().nullable().optional(),
  status: z.enum(SPEC_STATUSES).default("draft"),
  author: z.string().nullable().optional(),
  reviewers: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SpecFrontmatter = z.infer<typeof SpecFrontmatterSchema>;

export interface Spec extends SpecFrontmatter {
  content: string;
}

export function createSpecFrontmatter(
  id: string,
  title: string,
  overrides: Partial<SpecFrontmatter> = {}
): SpecFrontmatter {
  const now = new Date().toISOString().split("T")[0];
  return {
    id,
    title,
    epic: null,
    status: "draft",
    author: null,
    reviewers: [],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createSpecContent(title: string): string {
  return `# ${title}

## Overview

[Provide a brief overview of what this spec covers]

## Problem Statement

[What problem does this solve? Why is it important?]

## Goals

- [Goal 1]
- [Goal 2]

## Non-Goals

- [What is explicitly out of scope]

## Detailed Design

[Detailed description of the solution]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Open Questions

- [ ] [Question 1]
`;
}
