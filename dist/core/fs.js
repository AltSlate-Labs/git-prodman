import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import YAML from "yaml";
import matter from "gray-matter";
import { PRODMAN_DIR, PRODMAN_FILES, PRODMAN_DIRS } from "./constants.js";
import { RepoConfigSchema } from "./schemas/config.js";
import { EpicSchema } from "./schemas/epic.js";
import { IssueSchema } from "./schemas/issue.js";
/**
 * Find the root of the prodman project (directory containing .prodman/)
 */
export function findProdmanRoot(startDir = process.cwd()) {
    let current = startDir;
    while (current !== "/") {
        if (existsSync(join(current, PRODMAN_DIR))) {
            return current;
        }
        current = dirname(current);
    }
    return null;
}
/**
 * Check if current directory has .prodman/
 */
export function hasProdman(dir = process.cwd()) {
    return existsSync(join(dir, PRODMAN_DIR));
}
/**
 * Get path to a prodman file or directory
 */
export function getProdmanPath(root, ...parts) {
    return join(root, PRODMAN_DIR, ...parts);
}
/**
 * Read and parse the repo config
 */
export function readConfig(root) {
    const configPath = getProdmanPath(root, PRODMAN_FILES.config);
    if (!existsSync(configPath))
        return null;
    const content = readFileSync(configPath, "utf-8");
    const parsed = YAML.parse(content);
    return RepoConfigSchema.parse(parsed);
}
/**
 * Write the repo config
 */
export function writeConfig(root, config) {
    const configPath = getProdmanPath(root, PRODMAN_FILES.config);
    const content = YAML.stringify(config);
    writeFileSync(configPath, content, "utf-8");
}
/**
 * Read all epics
 */
export function readEpics(root) {
    const epicsDir = getProdmanPath(root, PRODMAN_DIRS.epics);
    if (!existsSync(epicsDir))
        return [];
    const files = readdirSync(epicsDir).filter((f) => f.endsWith(".yaml"));
    return files.map((file) => {
        const content = readFileSync(join(epicsDir, file), "utf-8");
        const parsed = YAML.parse(content);
        return EpicSchema.parse(parsed);
    });
}
/**
 * Read a single epic by ID
 */
export function readEpic(root, id) {
    const epics = readEpics(root);
    return epics.find((e) => e.id === id) || null;
}
/**
 * Write an epic
 */
export function writeEpic(root, epic) {
    const epicsDir = getProdmanPath(root, PRODMAN_DIRS.epics);
    if (!existsSync(epicsDir)) {
        mkdirSync(epicsDir, { recursive: true });
    }
    const slug = epic.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const filename = `${epic.id}-${slug}.yaml`;
    const filePath = join(epicsDir, filename);
    // Add comment header
    const content = `# Epic: ${epic.title}\n` + YAML.stringify(epic);
    writeFileSync(filePath, content, "utf-8");
    return filePath;
}
/**
 * Read all specs
 */
export function readSpecs(root) {
    const specsDir = getProdmanPath(root, PRODMAN_DIRS.specs);
    if (!existsSync(specsDir))
        return [];
    const files = readdirSync(specsDir).filter((f) => f.endsWith(".md"));
    return files.map((file) => {
        const content = readFileSync(join(specsDir, file), "utf-8");
        const { data, content: body } = matter(content);
        // Handle files without proper frontmatter
        const now = new Date().toISOString().split("T")[0];
        const title = data.title || file.replace(".md", "").replace(/-/g, " ");
        const id = data.id || `SPEC-${file.replace(".md", "").toUpperCase().slice(0, 8)}`;
        const frontmatter = {
            id,
            title,
            epic: data.epic || null,
            status: data.status || "draft",
            author: data.author || null,
            reviewers: data.reviewers || [],
            created_at: data.created_at || now,
            updated_at: data.updated_at || now,
        };
        return { ...frontmatter, content: body };
    });
}
/**
 * Read a single spec by ID
 */
export function readSpec(root, id) {
    const specs = readSpecs(root);
    return specs.find((s) => s.id === id) || null;
}
/**
 * Write a spec
 */
export function writeSpec(root, spec) {
    const specsDir = getProdmanPath(root, PRODMAN_DIRS.specs);
    if (!existsSync(specsDir)) {
        mkdirSync(specsDir, { recursive: true });
    }
    const slug = spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const filename = `${slug}.md`;
    const filePath = join(specsDir, filename);
    const { content, ...frontmatter } = spec;
    const fileContent = matter.stringify(content, frontmatter);
    writeFileSync(filePath, fileContent, "utf-8");
    return filePath;
}
/**
 * Generate next ID for a given type
 */
export function generateId(root, type) {
    const config = readConfig(root);
    const counters = config?.counters || { epic: 0, spec: 0, decision: 0, issue: 0 };
    const next = (counters[type] || 0) + 1;
    const prefixes = {
        epic: "EP",
        spec: "SPEC",
        decision: "DEC",
        issue: "ISS",
    };
    // Update counter
    if (config) {
        config.counters = { ...counters, [type]: next };
        writeConfig(root, config);
    }
    return `${prefixes[type]}-${String(next).padStart(3, "0")}`;
}
/**
 * Slugify a string for filenames
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
/** Read all issues */
export function readIssues(root) {
    const issuesDir = getProdmanPath(root, PRODMAN_DIRS.issues);
    if (!existsSync(issuesDir))
        return [];
    const files = readdirSync(issuesDir).filter((f) => f.endsWith(".yaml"));
    return files.map((file) => {
        const content = readFileSync(join(issuesDir, file), "utf-8");
        const parsed = YAML.parse(content);
        return IssueSchema.parse(parsed);
    });
}
/** Read a single issue by ID */
export function readIssue(root, id) {
    const issues = readIssues(root);
    return issues.find((i) => i.id.toUpperCase() === id.toUpperCase()) || null;
}
/** Write an issue */
export function writeIssue(root, issue) {
    const issuesDir = getProdmanPath(root, PRODMAN_DIRS.issues);
    if (!existsSync(issuesDir)) {
        mkdirSync(issuesDir, { recursive: true });
    }
    const slug = slugify(issue.title);
    const filename = `${issue.id.toLowerCase()}-${slug}.yaml`;
    const filePath = join(issuesDir, filename);
    const content = `# Issue: ${issue.title}\n` + YAML.stringify(issue);
    writeFileSync(filePath, content, "utf-8");
    return filePath;
}
/** Read all decisions */
export function readDecisions(root) {
    const decisionsDir = getProdmanPath(root, PRODMAN_DIRS.decisions);
    if (!existsSync(decisionsDir))
        return [];
    const files = readdirSync(decisionsDir).filter((f) => f.endsWith(".md"));
    return files.map((file) => {
        const content = readFileSync(join(decisionsDir, file), "utf-8");
        const { data, content: body } = matter(content);
        const now = new Date().toISOString().split("T")[0];
        return {
            id: data.id || `DEC-${file.replace(".md", "").toUpperCase().slice(0, 8)}`,
            title: data.title || file.replace(".md", "").replace(/-/g, " "),
            status: data.status || "proposed",
            date: data.date || now,
            deciders: data.deciders || [],
            supersedes: data.supersedes || null,
            superseded_by: data.superseded_by || null,
            content: body,
        };
    });
}
/** Read a single decision by ID */
export function readDecision(root, id) {
    const decisions = readDecisions(root);
    return decisions.find((d) => d.id.toUpperCase() === id.toUpperCase()) || null;
}
/** Write a decision */
export function writeDecision(root, decision) {
    const decisionsDir = getProdmanPath(root, PRODMAN_DIRS.decisions);
    if (!existsSync(decisionsDir)) {
        mkdirSync(decisionsDir, { recursive: true });
    }
    const slug = slugify(decision.title);
    const filename = `${decision.id.toLowerCase()}-${slug}.md`;
    const filePath = join(decisionsDir, filename);
    const { content, ...frontmatter } = decision;
    const fileContent = matter.stringify(content, frontmatter);
    writeFileSync(filePath, fileContent, "utf-8");
    return filePath;
}
