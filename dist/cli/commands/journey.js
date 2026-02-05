import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import YAML from "yaml";
import { findProdmanRoot, readJourneys, readJourney, writeJourney, generateId, getProdmanPath, } from "../../core/fs.js";
import { createJourneyFrontmatter, createJourneyContent, } from "../../core/schemas/journey.js";
import { JOURNEY_STATUSES, PRIORITIES, EMOTIONS, TOUCHPOINTS, PRODMAN_FILES, } from "../../core/constants.js";
import { commitChange, generateCommitMessage } from "../../core/git.js";
import { existsSync, readFileSync } from "fs";
export const journeyCommand = new Command("journey")
    .description("Manage user journeys")
    .alias("uj");
/** Read target users from product.yaml */
function readTargetUsers(root) {
    const productPath = getProdmanPath(root, PRODMAN_FILES.product);
    if (!existsSync(productPath))
        return [];
    const content = readFileSync(productPath, "utf-8");
    const parsed = YAML.parse(content);
    return parsed.target_users || [];
}
journeyCommand
    .command("create")
    .description("Create a new user journey")
    .option("-t, --title <title>", "Journey title")
    .option("-p, --persona <persona>", "Target persona ID from product.yaml")
    .option("-g, --goal <goal>", "User goal")
    .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    p.intro(pc.bgMagenta(pc.black(" Create User Journey ")));
    let title = options.title;
    if (!title) {
        title = await p.text({
            message: "Journey title:",
            placeholder: "First-time project setup",
            validate: (v) => (!v?.trim() ? "Title required" : undefined),
        });
        if (p.isCancel(title))
            process.exit(0);
    }
    // Persona selection
    let persona = options.persona;
    if (!persona) {
        const targetUsers = readTargetUsers(root);
        if (targetUsers.length > 0) {
            persona = await p.select({
                message: "Select target persona:",
                options: [
                    { value: null, label: "(None)" },
                    ...targetUsers.map((u) => ({
                        value: u.id,
                        label: `${u.name} (${u.priority})`,
                    })),
                ],
            });
            if (p.isCancel(persona))
                process.exit(0);
        }
    }
    // Goal
    let goal = options.goal;
    if (!goal) {
        goal = await p.text({
            message: "What is the user's goal?",
            placeholder: "Initialize prodman in an existing repository",
        });
        if (p.isCancel(goal))
            process.exit(0);
    }
    // Priority
    const priority = await p.select({
        message: "Priority:",
        options: PRIORITIES.map((pr) => ({ value: pr, label: pr.toUpperCase() })),
        initialValue: "p2",
    });
    if (p.isCancel(priority))
        process.exit(0);
    const s = p.spinner();
    s.start("Creating journey...");
    const id = generateId(root, "journey");
    const frontmatter = createJourneyFrontmatter(id, title, {
        persona: persona,
        goal: goal || "",
        priority: priority,
    });
    const content = createJourneyContent(title);
    const journey = { ...frontmatter, content };
    const filepath = writeJourney(root, journey);
    const relPath = filepath.replace(root + "/", "");
    // Auto-commit
    try {
        const msg = generateCommitMessage(relPath, "create");
        commitChange(root, relPath, msg);
        s.stop(pc.green(`Created ${pc.cyan(id)}: ${title}`));
        p.log.info(pc.dim(`Committed: ${msg}`));
    }
    catch {
        s.stop(pc.green(`Created ${pc.cyan(id)}: ${title}`));
    }
    p.outro(`File: ${pc.dim(relPath)}`);
});
journeyCommand
    .command("list")
    .description("List all user journeys")
    .option("-s, --status <status>", "Filter by status")
    .option("-p, --persona <persona>", "Filter by persona")
    .option("--json", "Output as JSON")
    .action((options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    let journeys = readJourneys(root);
    if (options.status) {
        journeys = journeys.filter((j) => j.status === options.status);
    }
    if (options.persona) {
        journeys = journeys.filter((j) => j.persona === options.persona);
    }
    if (options.json) {
        console.log(JSON.stringify(journeys, null, 2));
        return;
    }
    if (journeys.length === 0) {
        p.log.info(pc.dim("No journeys found."));
        return;
    }
    console.log();
    console.log(pc.bold("User Journeys"));
    console.log(pc.dim("-".repeat(70)));
    for (const journey of journeys) {
        const statusColor = getStatusColor(journey.status);
        const personaStr = journey.persona ? pc.dim(`@${journey.persona}`) : "";
        console.log(`${pc.cyan(journey.id.padEnd(8))} ${statusColor(journey.status.padEnd(12))} ${journey.title} ${personaStr}`);
    }
    console.log();
});
journeyCommand
    .command("show <id>")
    .description("Show journey details")
    .option("--json", "Output as JSON")
    .option("--content", "Show full markdown content")
    .action((id, options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    const journey = readJourney(root, id);
    if (!journey) {
        p.log.error(pc.red(`Journey ${id} not found.`));
        process.exit(1);
    }
    if (options.json) {
        console.log(JSON.stringify(journey, null, 2));
        return;
    }
    console.log();
    console.log(pc.bold(pc.cyan(journey.id)) + " " + journey.title);
    console.log(pc.dim("-".repeat(50)));
    console.log(`${pc.dim("Status:")} ${getStatusColor(journey.status)(journey.status)}`);
    console.log(`${pc.dim("Priority:")} ${journey.priority.toUpperCase()}`);
    if (journey.persona) {
        console.log(`${pc.dim("Persona:")} ${journey.persona}`);
    }
    if (journey.goal) {
        console.log(`${pc.dim("Goal:")} ${journey.goal}`);
    }
    if (journey.steps.length > 0) {
        console.log(`${pc.dim("Steps:")} ${journey.steps.length}`);
        for (const step of journey.steps) {
            const emotionColor = getEmotionColor(step.emotion || "neutral");
            console.log(`  ${pc.dim(String(step.order).padStart(2, " "))} ${step.action} ${pc.dim(`[${step.touchpoint}]`)} ${emotionColor(step.emotion || "neutral")}`);
        }
    }
    if (journey.epics.length > 0) {
        console.log(`${pc.dim("Epics:")} ${journey.epics.join(", ")}`);
    }
    if (options.content) {
        console.log();
        console.log(journey.content);
    }
    console.log();
});
journeyCommand
    .command("update <id>")
    .description("Update a journey")
    .option("-s, --status <status>", "Update status")
    .option("-p, --priority <priority>", "Update priority")
    .option("--add-epic <epicId>", "Link an epic")
    .option("--add-step", "Add a new step interactively")
    .action(async (id, options) => {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    const journey = readJourney(root, id);
    if (!journey) {
        p.log.error(pc.red(`Journey ${id} not found.`));
        process.exit(1);
    }
    let updated = { ...journey };
    if (options.status) {
        if (!JOURNEY_STATUSES.includes(options.status)) {
            p.log.error(pc.red(`Invalid status. Valid: ${JOURNEY_STATUSES.join(", ")}`));
            process.exit(1);
        }
        updated.status = options.status;
    }
    if (options.priority) {
        if (!PRIORITIES.includes(options.priority)) {
            p.log.error(pc.red(`Invalid priority. Valid: ${PRIORITIES.join(", ")}`));
            process.exit(1);
        }
        updated.priority = options.priority;
    }
    if (options.addEpic) {
        if (!updated.epics.includes(options.addEpic)) {
            updated.epics = [...updated.epics, options.addEpic];
        }
    }
    if (options.addStep) {
        const action = await p.text({
            message: "Step action:",
            placeholder: "User clicks the login button",
            validate: (v) => (!v?.trim() ? "Action required" : undefined),
        });
        if (p.isCancel(action))
            process.exit(0);
        const touchpoint = await p.select({
            message: "Touchpoint:",
            options: TOUCHPOINTS.map((t) => ({ value: t, label: t })),
        });
        if (p.isCancel(touchpoint))
            process.exit(0);
        const emotion = await p.select({
            message: "User emotion:",
            options: EMOTIONS.map((e) => ({ value: e, label: e })),
            initialValue: "neutral",
        });
        if (p.isCancel(emotion))
            process.exit(0);
        const newStep = {
            order: updated.steps.length + 1,
            action: action,
            touchpoint: touchpoint,
            emotion: emotion,
            pain_points: [],
            opportunities: [],
        };
        updated.steps = [...updated.steps, newStep];
    }
    updated.updated_at = new Date().toISOString().split("T")[0];
    const s = p.spinner();
    s.start("Updating journey...");
    const filepath = writeJourney(root, updated);
    const relPath = filepath.replace(root + "/", "");
    try {
        const msg = generateCommitMessage(relPath, "update");
        commitChange(root, relPath, msg);
        s.stop(pc.green(`Updated ${pc.cyan(id)}`));
        p.log.info(pc.dim(`Committed: ${msg}`));
    }
    catch {
        s.stop(pc.green(`Updated ${pc.cyan(id)}`));
    }
});
function getStatusColor(status) {
    switch (status) {
        case "draft":
            return pc.blue;
        case "validated":
            return pc.yellow;
        case "implemented":
            return pc.green;
        case "deprecated":
            return pc.gray;
        default:
            return pc.white;
    }
}
function getEmotionColor(emotion) {
    switch (emotion) {
        case "frustrated":
            return pc.red;
        case "confused":
            return pc.yellow;
        case "neutral":
            return pc.gray;
        case "satisfied":
            return pc.green;
        case "delighted":
            return pc.magenta;
        default:
            return pc.white;
    }
}
