import { z } from "zod";
import { ISSUE_STATUSES, ISSUE_TYPES, PRIORITIES } from "../constants.js";

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(ISSUE_TYPES).default("task"),
  status: z.enum(ISSUE_STATUSES).default("planned"),
  priority: z.enum(PRIORITIES).default("p2"),
  epic: z.string().nullable().optional(),
  description: z.string().optional(),
  assignee: z.string().nullable().optional(),
  reporter: z.string().nullable().optional(),
  labels: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Issue = z.infer<typeof IssueSchema>;

export function createIssue(
  id: string,
  title: string,
  overrides: Partial<Issue> = {}
): Issue {
  const now = new Date().toISOString().split("T")[0];
  return {
    id,
    title,
    type: "task",
    status: "planned",
    priority: "p2",
    epic: null,
    description: "",
    assignee: null,
    reporter: null,
    labels: [],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}
