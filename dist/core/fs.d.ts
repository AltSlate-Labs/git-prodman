import { type RepoConfig } from "./schemas/config.js";
import { type Epic } from "./schemas/epic.js";
import { type Spec } from "./schemas/spec.js";
import { type Issue } from "./schemas/issue.js";
import type { Decision } from "./schemas/decision.js";
/**
 * Find the root of the prodman project (directory containing .prodman/)
 */
export declare function findProdmanRoot(startDir?: string): string | null;
/**
 * Check if current directory has .prodman/
 */
export declare function hasProdman(dir?: string): boolean;
/**
 * Get path to a prodman file or directory
 */
export declare function getProdmanPath(root: string, ...parts: string[]): string;
/**
 * Read and parse the repo config
 */
export declare function readConfig(root: string): RepoConfig | null;
/**
 * Write the repo config
 */
export declare function writeConfig(root: string, config: RepoConfig): void;
/**
 * Read all epics
 */
export declare function readEpics(root: string): Epic[];
/**
 * Read a single epic by ID
 */
export declare function readEpic(root: string, id: string): Epic | null;
/**
 * Write an epic
 */
export declare function writeEpic(root: string, epic: Epic): string;
/**
 * Read all specs
 */
export declare function readSpecs(root: string): Spec[];
/**
 * Read a single spec by ID
 */
export declare function readSpec(root: string, id: string): Spec | null;
/**
 * Write a spec
 */
export declare function writeSpec(root: string, spec: Spec): string;
/**
 * Generate next ID for a given type
 */
export declare function generateId(root: string, type: "epic" | "spec" | "decision" | "issue"): string;
/**
 * Slugify a string for filenames
 */
export declare function slugify(text: string): string;
/** Read all issues */
export declare function readIssues(root: string): Issue[];
/** Read a single issue by ID */
export declare function readIssue(root: string, id: string): Issue | null;
/** Write an issue */
export declare function writeIssue(root: string, issue: Issue): string;
/** Read all decisions */
export declare function readDecisions(root: string): Decision[];
/** Read a single decision by ID */
export declare function readDecision(root: string, id: string): Decision | null;
/** Write a decision */
export declare function writeDecision(root: string, decision: Decision): string;
