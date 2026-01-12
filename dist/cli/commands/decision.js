import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProdmanRoot, readDecisions, readDecision, writeDecision, generateId, } from "../../core/fs.js";
import { createDecisionFrontmatter, createDecisionContent, } from "../../core/schemas/decision.js";
import { commitChange, generateCommitMessage } from "../../core/git.js";
export const decisionCommand = new Command("decision")
    .description("Manage architectural decisions (ADRs)")
    .alias("adr");
decisionCommand
    .command("create")
    .description("Create a new decision record")
    .option("-t, --title <title>", "Decision title")
    .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    p.intro(pc.bgBlue(pc.black(" Create Decision ")));
    let title = options.title;
    if (!title) {
        title = await p.text({
            message: "Decision title:",
            placeholder: "Use PostgreSQL for primary database",
            validate: (v) => (!v?.trim() ? "Title required" : undefined),
        });
        if (p.isCancel(title))
            process.exit(0);
    }
    const deciders = await p.text({
        message: "Deciders (comma-separated, optional):",
        placeholder: "alice, bob",
    });
    if (p.isCancel(deciders))
        process.exit(0);
    const s = p.spinner();
    s.start("Creating decision...");
    const id = generateId(root, "decision");
    const deciderList = deciders
        ? deciders.split(",").map((d) => d.trim()).filter(Boolean)
        : [];
    const frontmatter = createDecisionFrontmatter(id, title, {
        deciders: deciderList,
    });
    const content = createDecisionContent(title);
    const decision = { ...frontmatter, content };
    const filepath = writeDecision(root, decision);
    const relPath = filepath.replace(root + "/", "");
    // Auto-commit
    try {
        const msg = generateCommitMessage(relPath, "create");
        commitChange(root, relPath, msg);
        s.stop(pc.green(`✓ Created ${pc.cyan(id)}: ${title}`));
        p.log.info(pc.dim(`Committed: ${msg}`));
    }
    catch {
        s.stop(pc.green(`✓ Created ${pc.cyan(id)}: ${title}`));
    }
    p.outro(`File: ${pc.dim(relPath)}`);
});
decisionCommand
    .command("list")
    .description("List all decisions")
    .option("-s, --status <status>", "Filter by status")
    .action((options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    let decisions = readDecisions(root);
    if (options.status) {
        decisions = decisions.filter((d) => d.status === options.status);
    }
    if (decisions.length === 0) {
        p.log.info(pc.dim("No decisions found."));
        return;
    }
    console.log();
    console.log(pc.bold("Architectural Decisions"));
    console.log(pc.dim("─".repeat(60)));
    for (const dec of decisions) {
        const statusColor = getStatusColor(dec.status);
        console.log(`${pc.cyan(dec.id.padEnd(8))} ${statusColor(dec.status.padEnd(12))} ${dec.title}`);
    }
    console.log();
});
decisionCommand
    .command("show <id>")
    .description("Show decision details")
    .action((id) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    const decision = readDecision(root, id);
    if (!decision) {
        p.log.error(pc.red(`Decision ${id} not found.`));
        process.exit(1);
    }
    console.log();
    console.log(pc.bold(pc.cyan(decision.id)) + " " + decision.title);
    console.log(pc.dim("─".repeat(50)));
    console.log(`${pc.dim("Status:")} ${getStatusColor(decision.status)(decision.status)}`);
    console.log(`${pc.dim("Date:")} ${decision.date}`);
    if (decision.deciders.length > 0) {
        console.log(`${pc.dim("Deciders:")} ${decision.deciders.join(", ")}`);
    }
    if (decision.supersedes) {
        console.log(`${pc.dim("Supersedes:")} ${decision.supersedes}`);
    }
    if (decision.superseded_by) {
        console.log(`${pc.dim("Superseded by:")} ${decision.superseded_by}`);
    }
    console.log();
    console.log(decision.content);
    console.log();
});
function getStatusColor(status) {
    switch (status) {
        case "proposed": return pc.blue;
        case "accepted": return pc.green;
        case "rejected": return pc.red;
        case "superseded": return pc.yellow;
        case "deprecated": return pc.gray;
        default: return pc.white;
    }
}
