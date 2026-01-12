import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  findProdmanRoot,
  readEpics,
  readEpic,
  writeEpic,
  generateId,
} from "../../core/fs.js";
import { createEpic, type Epic } from "../../core/schemas/epic.js";
import { EPIC_STATUSES, PRIORITIES } from "../../core/constants.js";

export const epicCommand = new Command("epic")
  .description("Manage epics");

// epic create
epicCommand
  .command("create <title>")
  .description("Create a new epic")
  .option("-p, --priority <priority>", "Priority (p0-p3)", "p1")
  .option("-m, --milestone <milestone>", "Milestone ID")
  .option("-o, --owner <owner>", "Owner (e.g., @username)")
  .action(async (title: string, options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project. Run 'prodman init' first."));
      process.exit(1);
    }

    const id = generateId(root, "epic");
    const epic = createEpic(id, title, {
      priority: options.priority as Epic["priority"],
      milestone: options.milestone || null,
      owner: options.owner || null,
    });

    const filePath = writeEpic(root, epic);

    p.log.success(pc.green(`Created epic: ${id}`));
    p.log.info(pc.dim(`File: ${filePath}`));

    // Offer to add details interactively
    const addDetails = await p.confirm({
      message: "Add description and acceptance criteria now?",
      initialValue: false,
    });

    if (addDetails && !p.isCancel(addDetails)) {
      const details = await p.group({
        description: () =>
          p.text({
            message: "Description",
            placeholder: "Describe the epic...",
          }),
        criteria: () =>
          p.text({
            message: "Acceptance criteria (comma-separated)",
            placeholder: "User can login, User can logout, ...",
          }),
      });

      if (details.description) {
        epic.description = details.description as string;
      }
      if (details.criteria) {
        epic.acceptance_criteria = (details.criteria as string)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
      }
      epic.updated_at = new Date().toISOString().split("T")[0];

      writeEpic(root, epic);
      p.log.success(pc.green("Epic updated with details."));
    }
  });

// epic list
epicCommand
  .command("list")
  .description("List all epics")
  .option("-s, --status <status>", "Filter by status")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    let epics = readEpics(root);

    if (options.status) {
      epics = epics.filter((e) => e.status === options.status);
    }

    if (epics.length === 0) {
      p.log.info(pc.dim("No epics found."));
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(epics, null, 2));
      return;
    }

    // Display as table
    console.log();
    console.log(
      pc.bold(
        `${"ID".padEnd(10)} ${"Title".padEnd(35)} ${"Status".padEnd(12)} ${"Priority".padEnd(8)}`
      )
    );
    console.log(pc.dim("─".repeat(70)));

    for (const epic of epics) {
      const statusColor = getStatusColor(epic.status);
      console.log(
        `${pc.cyan(epic.id.padEnd(10))} ${epic.title.slice(0, 33).padEnd(35)} ${statusColor(
          epic.status.padEnd(12)
        )} ${epic.priority.padEnd(8)}`
      );
    }
    console.log();
  });

// epic show
epicCommand
  .command("show <id>")
  .description("Show epic details")
  .option("--json", "Output as JSON")
  .action(async (id: string, options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    const epic = readEpic(root, id.toUpperCase());
    if (!epic) {
      p.log.error(pc.red(`Epic not found: ${id}`));
      process.exit(1);
    }

    if (options.json) {
      console.log(JSON.stringify(epic, null, 2));
      return;
    }

    console.log();
    console.log(pc.bold(pc.cyan(`${epic.id}: ${epic.title}`)));
    console.log(pc.dim("─".repeat(50)));
    console.log(`${pc.dim("Status:")}     ${getStatusColor(epic.status)(epic.status)}`);
    console.log(`${pc.dim("Priority:")}   ${epic.priority}`);
    console.log(`${pc.dim("Owner:")}      ${epic.owner || pc.dim("(none)")}`);
    console.log(`${pc.dim("Milestone:")}  ${epic.milestone || pc.dim("(none)")}`);
    console.log(`${pc.dim("Target:")}     ${epic.target_date || pc.dim("(none)")}`);

    if (epic.description) {
      console.log();
      console.log(pc.dim("Description:"));
      console.log(epic.description);
    }

    if (epic.acceptance_criteria.length > 0) {
      console.log();
      console.log(pc.dim("Acceptance Criteria:"));
      for (const c of epic.acceptance_criteria) {
        console.log(`  • ${c}`);
      }
    }

    if (epic.dependencies.length > 0) {
      console.log();
      console.log(pc.dim("Dependencies:"), epic.dependencies.join(", "));
    }

    if (epic.labels.length > 0) {
      console.log();
      console.log(pc.dim("Labels:"), epic.labels.map((l) => pc.cyan(l)).join(" "));
    }

    console.log();
    console.log(
      pc.dim(`Created: ${epic.created_at} | Updated: ${epic.updated_at}`)
    );
    console.log();
  });

// epic update
epicCommand
  .command("update <id>")
  .description("Update an epic")
  .option("-s, --status <status>", "Update status")
  .option("-p, --priority <priority>", "Update priority")
  .option("-o, --owner <owner>", "Update owner")
  .option("-t, --target <date>", "Update target date")
  .action(async (id: string, options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    const epic = readEpic(root, id.toUpperCase());
    if (!epic) {
      p.log.error(pc.red(`Epic not found: ${id}`));
      process.exit(1);
    }

    let updated = false;

    if (options.status && EPIC_STATUSES.includes(options.status)) {
      epic.status = options.status;
      updated = true;
    }

    if (options.priority && PRIORITIES.includes(options.priority)) {
      epic.priority = options.priority;
      updated = true;
    }

    if (options.owner) {
      epic.owner = options.owner;
      updated = true;
    }

    if (options.target) {
      epic.target_date = options.target;
      updated = true;
    }

    if (updated) {
      epic.updated_at = new Date().toISOString().split("T")[0];
      writeEpic(root, epic);
      p.log.success(pc.green(`Updated epic: ${epic.id}`));
    } else {
      p.log.info(pc.dim("No changes made."));
    }
  });

function getStatusColor(status: string) {
  switch (status) {
    case "planning":
      return pc.dim;
    case "in_progress":
      return pc.yellow;
    case "complete":
      return pc.green;
    case "cancelled":
      return pc.red;
    default:
      return pc.white;
  }
}
