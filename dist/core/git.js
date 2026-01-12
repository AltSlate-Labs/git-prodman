import git from "isomorphic-git";
import * as fs from "fs";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
/** Check if directory is a git repo */
export function isGitRepo(dir) {
    return existsSync(join(dir, ".git"));
}
/** Get current branch name */
export async function getCurrentBranchAsync(root) {
    try {
        return await git.currentBranch({ fs, dir: root }) || null;
    }
    catch {
        return null;
    }
}
/** Sync version for compatibility */
export function getCurrentBranch(root) {
    try {
        return execSync("git rev-parse --abbrev-ref HEAD", {
            cwd: root,
            encoding: "utf-8",
        }).trim();
    }
    catch {
        return null;
    }
}
/** Check if repo has any commits */
export function hasCommits(root) {
    try {
        execSync("git rev-parse HEAD", { cwd: root, encoding: "utf-8" });
        return true;
    }
    catch {
        return false;
    }
}
/** Get list of uncommitted changes */
export function getUncommittedFiles(root) {
    try {
        const output = execSync("git status --porcelain", {
            cwd: root,
            encoding: "utf-8",
        });
        return output
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => line.slice(3));
    }
    catch {
        return [];
    }
}
/** Get count of unpushed commits */
export function getUnpushedCount(root) {
    try {
        const output = execSync("git cherry -v 2>/dev/null || true", {
            cwd: root,
            encoding: "utf-8",
        });
        return output.trim().split("\n").filter(Boolean).length;
    }
    catch {
        return 0;
    }
}
/** Stage a file */
export function stageFile(root, filepath) {
    execSync(`git add "${filepath}"`, { cwd: root });
}
/** Stage file using isomorphic-git */
export async function stageFileAsync(root, filepath) {
    await git.add({ fs, dir: root, filepath });
}
/** Commit staged changes with message */
export function commit(root, message) {
    try {
        const output = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
            cwd: root,
            encoding: "utf-8",
        });
        const match = output.match(/\[[\w-]+ ([a-f0-9]+)\]/);
        return match ? match[1] : "unknown";
    }
    catch (e) {
        throw new Error(`Commit failed: ${e.message}`);
    }
}
/** Commit using isomorphic-git */
export async function commitAsync(root, message, author) {
    const sha = await git.commit({
        fs,
        dir: root,
        message,
        author: author || {
            name: getGitConfigValue(root, "user.name") || "prodman",
            email: getGitConfigValue(root, "user.email") || "prodman@local",
        },
    });
    return sha.slice(0, 7);
}
/** Get git config value */
function getGitConfigValue(root, key) {
    try {
        return execSync(`git config ${key}`, { cwd: root, encoding: "utf-8" }).trim();
    }
    catch {
        return null;
    }
}
/** Commit a single file change */
export function commitChange(root, filepath, message) {
    stageFile(root, filepath);
    return commit(root, message);
}
/** Generate commit message from file change */
export function generateCommitMessage(filepath, changeType) {
    const action = changeType === "create" ? "Add" : changeType === "update" ? "Update" : "Delete";
    if (filepath.includes(".prodman/specs/")) {
        const name = filepath.split("/").pop()?.replace(".md", "") || "spec";
        return `${action} spec: ${name}`;
    }
    if (filepath.includes(".prodman/epics/")) {
        const name = filepath.split("/").pop()?.replace(".yaml", "") || "epic";
        return `${action} epic: ${name}`;
    }
    if (filepath.includes(".prodman/issues/")) {
        const name = filepath.split("/").pop()?.replace(".yaml", "") || "issue";
        return `${action} issue: ${name}`;
    }
    if (filepath.includes(".prodman/decisions/")) {
        const name = filepath.split("/").pop()?.replace(".md", "") || "decision";
        return `${action} decision: ${name}`;
    }
    return `${action}: ${filepath}`;
}
/** Get git status summary */
export function getGitStatus(root) {
    return {
        branch: getCurrentBranch(root),
        uncommitted: getUncommittedFiles(root),
        unpushedCount: getUnpushedCount(root),
        hasCommits: hasCommits(root),
    };
}
/** Get diff output */
export function getDiff(root, options) {
    try {
        let cmd = "git diff";
        if (options?.stat)
            cmd += " --stat";
        cmd += " .prodman/";
        if (options?.file)
            cmd = `git diff "${options.file}"`;
        return execSync(cmd, { cwd: root, encoding: "utf-8" });
    }
    catch {
        return "";
    }
}
/** Get list of files with merge conflicts */
export function getConflicts(root) {
    try {
        const output = execSync("git diff --name-only --diff-filter=U", {
            cwd: root,
            encoding: "utf-8",
        });
        return output.trim().split("\n").filter(Boolean);
    }
    catch {
        return [];
    }
}
/** Check if repo has conflicts */
export function hasConflicts(root) {
    return getConflicts(root).length > 0;
}
export function parseConflicts(content) {
    const lines = content.split("\n");
    const conflicts = [];
    let i = 0;
    while (i < lines.length) {
        if (lines[i].startsWith("<<<<<<<")) {
            const startLine = i;
            let ours = "";
            let theirs = "";
            i++;
            // Collect "ours" content
            while (i < lines.length && !lines[i].startsWith("=======")) {
                ours += lines[i] + "\n";
                i++;
            }
            i++; // Skip =======
            // Collect "theirs" content
            while (i < lines.length && !lines[i].startsWith(">>>>>>>")) {
                theirs += lines[i] + "\n";
                i++;
            }
            conflicts.push({
                startLine,
                endLine: i,
                ours: ours.trimEnd(),
                theirs: theirs.trimEnd(),
            });
        }
        i++;
    }
    return conflicts;
}
/** Resolve a conflict in a file */
export function resolveConflict(root, filepath, resolution, manualContent) {
    const fullPath = join(root, filepath);
    if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${filepath}`);
    }
    const content = readFileSync(fullPath, "utf-8");
    let resolved;
    if (resolution === "manual" && manualContent !== undefined) {
        resolved = manualContent;
    }
    else {
        const lines = content.split("\n");
        const result = [];
        let i = 0;
        while (i < lines.length) {
            if (lines[i].startsWith("<<<<<<<")) {
                let ours = [];
                let theirs = [];
                i++;
                // Collect "ours"
                while (i < lines.length && !lines[i].startsWith("=======")) {
                    ours.push(lines[i]);
                    i++;
                }
                i++; // Skip =======
                // Collect "theirs"
                while (i < lines.length && !lines[i].startsWith(">>>>>>>")) {
                    theirs.push(lines[i]);
                    i++;
                }
                i++; // Skip >>>>>>>
                // Apply resolution
                if (resolution === "ours") {
                    result.push(...ours);
                }
                else if (resolution === "theirs") {
                    result.push(...theirs);
                }
            }
            else {
                result.push(lines[i]);
                i++;
            }
        }
        resolved = result.join("\n");
    }
    writeFileSync(fullPath, resolved, "utf-8");
    // Stage the resolved file
    stageFile(root, filepath);
}
/** Get conflict details for a file */
export function getConflictDetails(root, filepath) {
    const fullPath = join(root, filepath);
    if (!existsSync(fullPath))
        return null;
    const content = readFileSync(fullPath, "utf-8");
    const conflicts = parseConflicts(content);
    return { content, conflicts };
}
/** Pull with conflict detection */
export async function pullWithConflictDetection(root) {
    try {
        execSync("git pull", { cwd: root, encoding: "utf-8" });
        const conflicts = getConflicts(root);
        if (conflicts.length > 0) {
            return {
                success: false,
                conflicts,
                message: `Pull completed with ${conflicts.length} conflict(s)`,
            };
        }
        return { success: true, conflicts: [], message: "Pull successful" };
    }
    catch (e) {
        const conflicts = getConflicts(root);
        return {
            success: false,
            conflicts,
            message: e.message || "Pull failed",
        };
    }
}
/** Push to remote */
export async function push(root, force = false) {
    const cmd = force ? "git push --force" : "git push";
    execSync(cmd, { cwd: root, stdio: "inherit" });
}
/** Get status matrix using isomorphic-git */
export async function getStatusMatrix(root) {
    return await git.statusMatrix({ fs, dir: root });
}
/** Initialize git repo using isomorphic-git */
export async function initRepo(root) {
    await git.init({ fs, dir: root, defaultBranch: "main" });
}
