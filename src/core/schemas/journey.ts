import { z } from "zod";
import {
  JOURNEY_STATUSES,
  PRIORITIES,
  EMOTIONS,
  TOUCHPOINTS,
} from "../constants.js";

// Schema for individual journey steps
export const JourneyStepSchema = z.object({
  order: z.number(),
  action: z.string(),
  touchpoint: z.enum(TOUCHPOINTS),
  emotion: z.enum(EMOTIONS).optional().default("neutral"),
  pain_points: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
});

export type JourneyStep = z.infer<typeof JourneyStepSchema>;

// Frontmatter schema for journey markdown files
export const JourneyFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  persona: z.string().nullable().optional(),
  goal: z.string().default(""),
  status: z.enum(JOURNEY_STATUSES).default("draft"),
  priority: z.enum(PRIORITIES).default("p2"),
  steps: z.array(JourneyStepSchema).default([]),
  epics: z.array(z.string()).default([]),
  related_journeys: z.array(z.string()).default([]),
  author: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type JourneyFrontmatter = z.infer<typeof JourneyFrontmatterSchema>;

export interface Journey extends JourneyFrontmatter {
  content: string;
}

export function createJourneyFrontmatter(
  id: string,
  title: string,
  overrides: Partial<JourneyFrontmatter> = {}
): JourneyFrontmatter {
  const now = new Date().toISOString().split("T")[0];
  return {
    id,
    title,
    persona: null,
    goal: "",
    status: "draft",
    priority: "p2",
    steps: [],
    epics: [],
    related_journeys: [],
    author: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createJourneyContent(title: string): string {
  return `# ${title}

## Overview

[Describe the user journey scenario and context]

## Persona

**Target User:** [Select from product.yaml target_users]

**Goal:** [What does the user want to achieve?]

## Notes

[Additional context, research findings, or observations]

## Related Epics

- [List linked epics]
`;
}
