import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProdmanRoot, readConfig, readEpics, readSpecs } from "../../core/fs.js";

export const statusCommand = new Command("status")
  .description("Show project status")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    const config = readConfig(root);
    const epics = readEpics(root);
    const specs = readSpecs(root);

    // Git status
    let gitStatus = { clean: true, ahead: 0, behind: 0, uncommitted: 0 };
    try {
      const { execSync } = await import("child_process");
      const status = execSync("git status --porcelain", { cwd: root, encoding: "utf-8" });
      gitStatus.uncommitted = status.trim().split("\n").filter(Boolean).length;
      gitStatus.clean = gitStatus.uncommitted === 0;

      // Check ahead/behind
      try {
        const ahead = execSync("git rev-list @{u}..HEAD --count", { cwd: root, encoding: "utf-8" });
        gitStatus.ahead = parseInt(ahead.trim(), 10) || 0;
      } catch {}
      try {
        const behind = execSync("git rev-list HEAD..@{u} --count", { cwd: root, encoding: "utf-8" });
        gitStatus.behind = parseInt(behind.trim(), 10) || 0;
      } catch {}
    } catch {}

const epicsByStatus = {
    planning: epics.filter((e) => e.status === "planning" || e.status === "planned").length,
    in_progress: epics.filter((e) => e.status === "in_progress").length,
    complete: epics.filter((e) => e.status === "complete").length,
    cancelled: epics.filter((e) => e.status === "cancelled").length,
  };

    const specsByStatus = {
      draft: specs.filter((s) => s.status === "draft").length,
      review: specs.filter((s) => s.status === "review").length,
      approved: specs.filter((s) => s.status === "approved").length,
      implemented: specs.filter((s) => s.status === "implemented").length,
    };

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            project: config?.project,
            git: gitStatus,
            epics: epicsByStatus,
            specs: specsByStatus,
          },
          null,
          2
        )
      );
      return;
    }

    console.log();
    console.log(pc.bold(pc.cyan(`📊 ${config?.project.name || "Project"}`)));
    console.log(pc.dim("─".repeat(50)));
    console.log();

    // Git status
    console.log(pc.bold("Git Status"));
    if (gitStatus.clean) {
      console.log(pc.green("  ✓ Working tree clean"));
    } else {
      console.log(pc.yellow(`  ● ${gitStatus.uncommitted} uncommitted changes`));
    }
    if (gitStatus.ahead > 0) {
      console.log(pc.cyan(`  ↑ ${gitStatus.ahead} commits ahead of remote`));
    }
    if (gitStatus.behind > 0) {
      console.log(pc.magenta(`  ↓ ${gitStatus.behind} commits behind remote`));
    }
    console.log();

    // Epics
    console.log(pc.bold("Epics"));
    console.log(
      `  ${pc.dim("Planning:")}     ${epicsByStatus.planning}`
    );
    console.log(
      `  ${pc.yellow("In Progress:")}  ${epicsByStatus.in_progress}`
    );
    console.log(
      `  ${pc.green("Complete:")}     ${epicsByStatus.complete}`
    );
    if (epicsByStatus.cancelled > 0) {
      console.log(
        `  ${pc.red("Cancelled:")}    ${epicsByStatus.cancelled}`
      );
    }
    console.log();

    // Specs
    console.log(pc.bold("Specs"));
    console.log(`  ${pc.dim("Draft:")}        ${specsByStatus.draft}`);
    console.log(`  ${pc.yellow("Review:")}       ${specsByStatus.review}`);
    console.log(`  ${pc.blue("Approved:")}     ${specsByStatus.approved}`);
    console.log(`  ${pc.green("Implemented:")}  ${specsByStatus.implemented}`);
    console.log();
  });
