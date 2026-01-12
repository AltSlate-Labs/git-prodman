import { z } from "zod";
import { DECISION_STATUSES } from "../constants.js";
export const DecisionFrontmatterSchema = z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(DECISION_STATUSES).default("proposed"),
    date: z.string(),
    deciders: z.array(z.string()).default([]),
    supersedes: z.string().nullable().optional(),
    superseded_by: z.string().nullable().optional(),
});
export function createDecisionFrontmatter(id, title, overrides = {}) {
    const now = new Date().toISOString().split("T")[0];
    return {
        id,
        title,
        status: "proposed",
        date: now,
        deciders: [],
        supersedes: null,
        superseded_by: null,
        ...overrides,
    };
}
export function createDecisionContent(title) {
    return `# ${title}

## Context

[What is the issue that we're seeing that is motivating this decision?]

## Decision

[What is the change that we're proposing and/or doing?]

## Consequences

[What becomes easier or more difficult to do because of this change?]

## Alternatives Considered

1. **[Alternative 1]**: [Description]
2. **[Alternative 2]**: [Description]
`;
}
