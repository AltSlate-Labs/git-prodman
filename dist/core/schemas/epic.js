import { z } from "zod";
import { EPIC_STATUSES, PRIORITIES } from "../constants.js";
export const EpicSchema = z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(EPIC_STATUSES).default("planning"),
    priority: z.enum(PRIORITIES).default("p1"),
    owner: z.string().nullable().optional(),
    milestone: z.string().nullable().optional(),
    spec: z.string().nullable().optional(),
    description: z.string().optional(),
    acceptance_criteria: z.array(z.string()).default([]),
    dependencies: z.array(z.string()).default([]),
    issues: z.array(z.string()).default([]),
    labels: z.array(z.string()).default([]),
    target_date: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});
export function createEpic(id, title, overrides = {}) {
    const now = new Date().toISOString().split("T")[0];
    return {
        id,
        title,
        status: "planning",
        priority: "p1",
        owner: null,
        milestone: null,
        spec: null,
        description: "",
        acceptance_criteria: [],
        dependencies: [],
        issues: [],
        labels: [],
        target_date: null,
        created_at: now,
        updated_at: now,
        ...overrides,
    };
}
