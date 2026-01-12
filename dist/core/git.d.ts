/** Check if directory is a git repo */
export declare function isGitRepo(dir: string): boolean;
/** Get current branch name */
export declare function getCurrentBranchAsync(root: string): Promise<string | null>;
/** Sync version for compatibility */
export declare function getCurrentBranch(root: string): string | null;
/** Check if repo has any commits */
export declare function hasCommits(root: string): boolean;
/** Get list of uncommitted changes */
export declare function getUncommittedFiles(root: string): string[];
/** Get count of unpushed commits */
export declare function getUnpushedCount(root: string): number;
/** Stage a file */
export declare function stageFile(root: string, filepath: string): void;
/** Stage file using isomorphic-git */
export declare function stageFileAsync(root: string, filepath: string): Promise<void>;
/** Commit staged changes with message */
export declare function commit(root: string, message: string): string;
/** Commit using isomorphic-git */
export declare function commitAsync(root: string, message: string, author?: {
    name: string;
    email: string;
}): Promise<string>;
/** Commit a single file change */
export declare function commitChange(root: string, filepath: string, message: string): string;
/** Generate commit message from file change */
export declare function generateCommitMessage(filepath: string, changeType: "create" | "update" | "delete"): string;
/** Get git status summary */
export declare function getGitStatus(root: string): {
    branch: string | null;
    uncommitted: string[];
    unpushedCount: number;
    hasCommits: boolean;
};
/** Get diff output */
export declare function getDiff(root: string, options?: {
    stat?: boolean;
    file?: string;
}): string;
/** Get list of files with merge conflicts */
export declare function getConflicts(root: string): string[];
/** Check if repo has conflicts */
export declare function hasConflicts(root: string): boolean;
/** Parse conflict markers in a file */
export interface ConflictBlock {
    startLine: number;
    endLine: number;
    ours: string;
    theirs: string;
}
export declare function parseConflicts(content: string): ConflictBlock[];
/** Resolve a conflict in a file */
export declare function resolveConflict(root: string, filepath: string, resolution: "ours" | "theirs" | "manual", manualContent?: string): void;
/** Get conflict details for a file */
export declare function getConflictDetails(root: string, filepath: string): {
    content: string;
    conflicts: ConflictBlock[];
} | null;
/** Pull with conflict detection */
export declare function pullWithConflictDetection(root: string): Promise<{
    success: boolean;
    conflicts: string[];
    message: string;
}>;
/** Push to remote */
export declare function push(root: string, force?: boolean): Promise<void>;
/** Get status matrix using isomorphic-git */
export declare function getStatusMatrix(root: string): Promise<Array<[string, number, number, number]>>;
/** Initialize git repo using isomorphic-git */
export declare function initRepo(root: string): Promise<void>;
