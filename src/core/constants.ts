export const VERSION = "0.1.0";

export const PRODMAN_DIR = ".prodman";

export const PRODMAN_FILES = {
  config: "config.yaml",
  product: "product.yaml",
  roadmap: "roadmap.yaml",
  agents: "agents.yaml",
} as const;

export const PRODMAN_DIRS = {
  epics: "epics",
  specs: "specs",
  decisions: "decisions",
  templates: "templates",
  issues: "issues",
} as const;

export const DEFAULT_CONFIG_PATH = "~/.config/prodman/config.yaml";

export const AI_PROVIDERS = ["openai", "anthropic", "ollama"] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

export const EPIC_STATUSES = [
  "planned",
  "planning",
  "in_progress",
  "complete",
  "cancelled",
] as const;
export type EpicStatus = (typeof EPIC_STATUSES)[number];

export const SPEC_STATUSES = [
  "draft",
  "review",
  "approved",
  "implemented",
] as const;
export type SpecStatus = (typeof SPEC_STATUSES)[number];

export const PRIORITIES = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ISSUE_STATUSES = EPIC_STATUSES;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_TYPES = ["bug", "feature", "task", "improvement"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const DECISION_STATUSES = [
  "proposed",
  "accepted",
  "rejected",
  "superseded",
  "deprecated",
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];
