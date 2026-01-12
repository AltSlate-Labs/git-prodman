import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProdmanRoot, readSpecs, readSpec, writeSpec, generateId, } from "../../core/fs.js";
import { createSpecFrontmatter, createSpecContent, } from "../../core/schemas/spec.js";
export const specCommand = new Command("spec").description("Manage specs");
// spec create
specCommand
    .command("create <title>")
    .description("Create a new spec")
    .option("-e, --epic <epicId>", "Link to epic")
    .option("-a, --author <author>", "Author (e.g., @username)")
    .action(async (title, options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project. Run 'prodman init' first."));
        process.exit(1);
    }
    const id = generateId(root, "spec");
    const frontmatter = createSpecFrontmatter(id, title, {
        epic: options.epic || null,
        author: options.author || null,
    });
    const content = createSpecContent(title);
    const spec = { ...frontmatter, content };
    const filePath = writeSpec(root, spec);
    p.log.success(pc.green(`Created spec: ${id}`));
    p.log.info(pc.dim(`File: ${filePath}`));
    p.log.info(pc.dim(`Edit the file to add your spec content.`));
});
// spec list
specCommand
    .command("list")
    .description("List all specs")
    .option("-s, --status <status>", "Filter by status")
    .option("--json", "Output as JSON")
    .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    let specs = readSpecs(root);
    if (options.status) {
        specs = specs.filter((s) => s.status === options.status);
    }
    if (specs.length === 0) {
        p.log.info(pc.dim("No specs found."));
        return;
    }
    if (options.json) {
        console.log(JSON.stringify(specs.map(({ content, ...s }) => s), null, 2));
        return;
    }
    // Display as table
    console.log();
    console.log(pc.bold(`${"ID".padEnd(12)} ${"Title".padEnd(40)} ${"Status".padEnd(12)} ${"Epic".padEnd(10)}`));
    console.log(pc.dim("─".repeat(80)));
    for (const spec of specs) {
        const statusColor = getStatusColor(spec.status);
        console.log(`${pc.cyan(spec.id.padEnd(12))} ${spec.title.slice(0, 38).padEnd(40)} ${statusColor(spec.status.padEnd(12))} ${(spec.epic || "-").padEnd(10)}`);
    }
    console.log();
});
// spec show
specCommand
    .command("show <id>")
    .description("Show spec details")
    .option("--json", "Output as JSON")
    .option("--content", "Show full content")
    .action(async (id, options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    const spec = readSpec(root, id.toUpperCase());
    if (!spec) {
        p.log.error(pc.red(`Spec not found: ${id}`));
        process.exit(1);
    }
    if (options.json) {
        console.log(JSON.stringify(spec, null, 2));
        return;
    }
    console.log();
    console.log(pc.bold(pc.cyan(`${spec.id}: ${spec.title}`)));
    console.log(pc.dim("─".repeat(50)));
    console.log(`${pc.dim("Status:")}     ${getStatusColor(spec.status)(spec.status)}`);
    console.log(`${pc.dim("Epic:")}       ${spec.epic || pc.dim("(none)")}`);
    console.log(`${pc.dim("Author:")}     ${spec.author || pc.dim("(none)")}`);
    console.log(`${pc.dim("Reviewers:")}  ${spec.reviewers.length > 0 ? spec.reviewers.join(", ") : pc.dim("(none)")}`);
    console.log();
    console.log(pc.dim(`Created: ${spec.created_at} | Updated: ${spec.updated_at}`));
    if (options.content) {
        console.log();
        console.log(pc.dim("─".repeat(50)));
        console.log(spec.content);
    }
    console.log();
});
function getStatusColor(status) {
    switch (status) {
        case "draft":
            return pc.dim;
        case "review":
            return pc.yellow;
        case "approved":
            return pc.blue;
        case "implemented":
            return pc.green;
        default:
            return pc.white;
    }
}
