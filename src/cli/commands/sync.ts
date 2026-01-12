import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProdmanRoot } from "../../core/fs.js";
import {
  pullWithConflictDetection,
  getConflicts,
  hasConflicts,
  getConflictDetails,
  resolveConflict,
} from "../../core/git.js";
import { execSync } from "child_process";

export const syncCommand = new Command("sync")
  .description("Push local commits to remote")
  .option("-f, --force", "Force push")
  .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    p.intro(pc.bgCyan(pc.black(" git-prodman sync ")));

    const s = p.spinner();
    s.start("Syncing with remote...");

    try {
      // Check for uncommitted changes
      const status = execSync("git status --porcelain", { cwd: root, encoding: "utf-8" });
      if (status.trim()) {
        s.stop("Found uncommitted changes");
        p.log.info(pc.dim("Committing changes first..."));
        execSync("git add .prodman/", { cwd: root });
        execSync('git commit -m "chore(prodman): update product management files"', { cwd: root });
      }

      // Push
      const pushCmd = options.force ? "git push --force" : "git push";
      execSync(pushCmd, { cwd: root, stdio: "inherit" });

      s.stop(pc.green("Synced successfully"));
      p.outro(pc.green("✓ ") + "Changes pushed to remote");
    } catch (error: any) {
      s.stop(pc.red("Sync failed"));
      if (error.message?.includes("nothing to commit")) {
        p.log.info(pc.dim("Nothing to sync."));
      } else {
        p.log.error(error.message || String(error));
      }
    }
  });

export const pullCommand = new Command("pull")
  .description("Pull remote changes (with conflict detection)")
  .action(async () => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    p.intro(pc.bgCyan(pc.black(" git-prodman pull ")));

    const s = p.spinner();
    s.start("Pulling from remote...");

    try {
      const result = await pullWithConflictDetection(root);

      if (result.conflicts.length > 0) {
        s.stop(pc.yellow("Pull completed with conflicts"));

        p.log.warn(pc.yellow(`Found ${result.conflicts.length} file(s) with conflicts:`));
        for (const file of result.conflicts) {
          console.log(pc.red(`  ✗ ${file}`));
        }

        console.log();
        p.log.info(pc.dim("You can resolve conflicts with:"));
        p.log.info(pc.dim("  prodman resolve <file> --ours    # Keep your version"));
        p.log.info(pc.dim("  prodman resolve <file> --theirs  # Keep remote version"));
        p.log.info(pc.dim("  prodman ui                       # Use visual resolver"));

        p.outro(pc.yellow("Conflicts need resolution"));
      } else {
        s.stop(pc.green("Pulled successfully"));
        p.outro(pc.green("✓ ") + "Up to date with remote");
      }
    } catch (error: any) {
      s.stop(pc.red("Pull failed"));
      p.log.error(error.message || String(error));
    }
  });

export const resolveCommand = new Command("resolve")
  .description("Resolve merge conflicts")
  .argument("<file>", "File with conflicts to resolve")
  .option("--ours", "Keep our version")
  .option("--theirs", "Keep their version")
  .action(async (file: string, options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    p.intro(pc.bgCyan(pc.black(" git-prodman resolve ")));

    // Check if file has conflicts
    const conflicts = getConflicts(root);
    if (!conflicts.includes(file) && !conflicts.some((c) => c.endsWith(file))) {
      p.log.error(pc.red(`File "${file}" does not have conflicts.`));
      
      if (conflicts.length > 0) {
        p.log.info(pc.dim("Files with conflicts:"));
        for (const f of conflicts) {
          console.log(pc.yellow(`  ${f}`));
        }
      }
      process.exit(1);
    }

    const fullPath = conflicts.find((c) => c === file || c.endsWith(file)) || file;

    if (!options.ours && !options.theirs) {
      // Interactive resolution
      const details = getConflictDetails(root, fullPath);
      if (!details || details.conflicts.length === 0) {
        p.log.error(pc.red("Could not parse conflicts in file."));
        process.exit(1);
      }

      p.log.info(pc.dim(`Found ${details.conflicts.length} conflict(s) in ${fullPath}`));

      for (let i = 0; i < details.conflicts.length; i++) {
        const conflict = details.conflicts[i];
        console.log();
        console.log(pc.cyan(`─── Conflict ${i + 1} ───`));
        console.log(pc.green("OURS (your changes):"));
        console.log(conflict.ours || pc.dim("(empty)"));
        console.log();
        console.log(pc.red("THEIRS (remote changes):"));
        console.log(conflict.theirs || pc.dim("(empty)"));
        console.log(pc.cyan("───────────────────"));
      }

      const choice = await p.select({
        message: "How do you want to resolve?",
        options: [
          { value: "ours", label: "Keep ours (your changes)" },
          { value: "theirs", label: "Keep theirs (remote changes)" },
          { value: "cancel", label: "Cancel" },
        ],
      });

      if (p.isCancel(choice) || choice === "cancel") {
        p.outro("Cancelled");
        return;
      }

      resolveConflict(root, fullPath, choice as "ours" | "theirs");
    } else {
      const resolution = options.ours ? "ours" : "theirs";
      resolveConflict(root, fullPath, resolution);
    }

    p.log.success(pc.green(`Resolved conflicts in ${fullPath}`));

    // Check if more conflicts remain
    const remaining = getConflicts(root);
    if (remaining.length > 0) {
      p.log.info(pc.dim(`${remaining.length} file(s) still have conflicts.`));
    } else {
      p.log.info(pc.dim("All conflicts resolved. Don't forget to commit!"));
    }

    p.outro("");
  });

export const conflictsCommand = new Command("conflicts")
  .description("List files with merge conflicts")
  .action(async () => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    const conflicts = getConflicts(root);

    if (conflicts.length === 0) {
      p.log.success(pc.green("No merge conflicts."));
      return;
    }

    p.log.warn(pc.yellow(`${conflicts.length} file(s) with conflicts:`));
    for (const file of conflicts) {
      console.log(pc.red(`  ✗ ${file}`));
    }
  });
