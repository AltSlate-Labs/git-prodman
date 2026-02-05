export const VERSION = "0.1.0";
export const PRODMAN_DIR = ".prodman";
export const PRODMAN_FILES = {
    config: "config.yaml",
    product: "product.yaml",
    roadmap: "roadmap.yaml",
    agents: "agents.yaml",
};
export const PRODMAN_DIRS = {
    epics: "epics",
    specs: "specs",
    decisions: "decisions",
    templates: "templates",
    issues: "issues",
};
export const DEFAULT_CONFIG_PATH = "~/.config/prodman/config.yaml";
export const AI_PROVIDERS = ["openai", "anthropic", "ollama"];
export const EPIC_STATUSES = [
    "planned",
    "planning",
    "in_progress",
    "complete",
    "cancelled",
];
export const SPEC_STATUSES = [
    "draft",
    "review",
    "approved",
    "implemented",
];
export const PRIORITIES = ["p0", "p1", "p2", "p3"];
export const ISSUE_STATUSES = EPIC_STATUSES;
export const ISSUE_TYPES = ["bug", "feature", "task", "improvement"];
export const DECISION_STATUSES = [
    "proposed",
    "accepted",
    "rejected",
    "superseded",
    "deprecated",
];
