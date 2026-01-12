import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProdmanRoot } from "../../core/fs.js";
import { getDiff, getUncommittedFiles, hasCommits } from "../../core/git.js";
export const diffCommand = new Command("diff")
    .description("Show uncommitted changes in .prodman/")
    .option("--stat", "Show only file statistics")
    .option("-f, --file <path>", "Show diff for specific file")
    .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    p.intro(pc.bgCyan(pc.black(" git-prodman diff ")));
    if (!hasCommits(root)) {
        p.log.warn(pc.yellow("No commits yet in this repository."));
        const files = getUncommittedFiles(root);
        if (files.length > 0) {
            p.log.info(pc.dim("Untracked files:"));
            for (const f of files) {
                console.log(pc.green(`  + ${f}`));
            }
        }
        else {
            p.log.info(pc.dim("No changes."));
        }
        p.outro("");
        return;
    }
    try {
        const diff = getDiff(root, {
            stat: options.stat,
            file: options.file,
        });
        if (!diff.trim()) {
            p.log.info(pc.dim("No uncommitted changes in .prodman/"));
            p.outro("");
            return;
        }
        // Colorize diff output
        const lines = diff.split("\n");
        for (const line of lines) {
            if (line.startsWith("+") && !line.startsWith("+++")) {
                console.log(pc.green(line));
            }
            else if (line.startsWith("-") && !line.startsWith("---")) {
                console.log(pc.red(line));
            }
            else if (line.startsWith("@@")) {
                console.log(pc.cyan(line));
            }
            else if (line.startsWith("diff ") || line.startsWith("index ")) {
                console.log(pc.dim(line));
            }
            else {
                console.log(line);
            }
        }
        p.outro("");
    }
    catch (error) {
        p.log.error(pc.red(error.message || String(error)));
        process.exit(1);
    }
});
