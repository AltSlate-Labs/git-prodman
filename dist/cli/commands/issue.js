import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { findProdmanRoot, readIssues, readIssue, writeIssue, generateId, } from "../../core/fs.js";
import { createIssue } from "../../core/schemas/issue.js";
import { ISSUE_TYPES, PRIORITIES } from "../../core/constants.js";
import { commitChange, generateCommitMessage } from "../../core/git.js";
export const issueCommand = new Command("issue")
    .description("Manage issues");
issueCommand
    .command("create")
    .description("Create a new issue")
    .option("-t, --title <title>", "Issue title")
    .option("--type <type>", "Issue type (bug, feature, task, improvement)")
    .option("-p, --priority <priority>", "Priority (p0-p3)")
    .option("-e, --epic <epic>", "Parent epic ID")
    .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    p.intro(pc.bgMagenta(pc.black(" Create Issue ")));
    let title = options.title;
    if (!title) {
        title = await p.text({
            message: "Issue title:",
            placeholder: "Fix login button not working",
            validate: (v) => (!v?.trim() ? "Title required" : undefined),
        });
        if (p.isCancel(title))
            process.exit(0);
    }
    let type = options.type;
    if (!type) {
        type = await p.select({
            message: "Issue type:",
            options: ISSUE_TYPES.map((t) => ({ value: t, label: t })),
        });
        if (p.isCancel(type))
            process.exit(0);
    }
    let priority = options.priority;
    if (!priority) {
        priority = await p.select({
            message: "Priority:",
            options: PRIORITIES.map((p) => ({ value: p, label: p })),
            initialValue: "p2",
        });
        if (p.isCancel(priority))
            process.exit(0);
    }
    const description = await p.text({
        message: "Description (optional):",
        placeholder: "Detailed description of the issue",
    });
    if (p.isCancel(description))
        process.exit(0);
    const s = p.spinner();
    s.start("Creating issue...");
    const id = generateId(root, "issue");
    const issue = createIssue(id, title, {
        type: type,
        priority: priority,
        epic: options.epic || null,
        description: description || "",
    });
    const filepath = writeIssue(root, issue);
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
issueCommand
    .command("list")
    .description("List all issues")
    .option("-s, --status <status>", "Filter by status")
    .option("--type <type>", "Filter by type")
    .action((options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    let issues = readIssues(root);
    if (options.status) {
        issues = issues.filter((i) => i.status === options.status);
    }
    if (options.type) {
        issues = issues.filter((i) => i.type === options.type);
    }
    if (issues.length === 0) {
        p.log.info(pc.dim("No issues found."));
        return;
    }
    console.log();
    console.log(pc.bold("Issues"));
    console.log(pc.dim("─".repeat(60)));
    for (const issue of issues) {
        const statusColor = getStatusColor(issue.status);
        const typeIcon = getTypeIcon(issue.type);
        console.log(`${typeIcon} ${pc.cyan(issue.id.padEnd(8))} ${statusColor(issue.status.padEnd(12))} ${pc.yellow(issue.priority)} ${issue.title}`);
    }
    console.log();
});
issueCommand
    .command("show <id>")
    .description("Show issue details")
    .action((id) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    const issue = readIssue(root, id);
    if (!issue) {
        p.log.error(pc.red(`Issue ${id} not found.`));
        process.exit(1);
    }
    console.log();
    console.log(pc.bold(pc.cyan(issue.id)) + " " + issue.title);
    console.log(pc.dim("─".repeat(50)));
    console.log(`${pc.dim("Type:")} ${getTypeIcon(issue.type)} ${issue.type}`);
    console.log(`${pc.dim("Status:")} ${getStatusColor(issue.status)(issue.status)}`);
    console.log(`${pc.dim("Priority:")} ${pc.yellow(issue.priority)}`);
    if (issue.epic)
        console.log(`${pc.dim("Epic:")} ${issue.epic}`);
    if (issue.assignee)
        console.log(`${pc.dim("Assignee:")} ${issue.assignee}`);
    if (issue.labels.length > 0)
        console.log(`${pc.dim("Labels:")} ${issue.labels.join(", ")}`);
    console.log(`${pc.dim("Created:")} ${issue.created_at}`);
    if (issue.description) {
        console.log();
        console.log(issue.description);
    }
    console.log();
});
function getStatusColor(status) {
    switch (status) {
        case "planned": return pc.dim;
        case "planning": return pc.blue;
        case "in_progress": return pc.yellow;
        case "complete": return pc.green;
        case "cancelled": return pc.red;
        default: return pc.white;
    }
}
function getTypeIcon(type) {
    switch (type) {
        case "bug": return "🐛";
        case "feature": return "✨";
        case "task": return "📋";
        case "improvement": return "🔧";
        default: return "•";
    }
}
