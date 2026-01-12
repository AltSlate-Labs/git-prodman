import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import YAML from "yaml";
import { findProdmanRoot, readEpics, readSpecs, getProdmanPath, } from "../../core/fs.js";
import { PRODMAN_FILES } from "../../core/constants.js";
const USER_CONFIG_PATH = join(homedir(), ".config", "prodman", "config.yaml");
export const askCommand = new Command("ask")
    .description("Ask AI about your product")
    .argument("<query...>", "Your question")
    .action(async (queryParts) => {
    const query = queryParts.join(" ");
    await handleAsk(query);
});
export async function handleAsk(query) {
    const root = findProdmanRoot();
    if (!root) {
        p.log.error(pc.red("Not in a git-prodman project."));
        process.exit(1);
    }
    // Read user config for AI settings
    const userConfig = readUserConfig();
    if (!userConfig?.ai?.provider) {
        p.log.error(pc.red("No AI provider configured. Run: ") + pc.cyan("prodman config set"));
        process.exit(1);
    }
    const s = p.spinner();
    s.start("Gathering context...");
    // Build context from .prodman/
    const context = await buildContext(root);
    s.message("Thinking...");
    try {
        const response = await queryAI(userConfig, query, context);
        s.stop("");
        console.log();
        console.log(pc.cyan("🤖 AI Response:"));
        console.log(pc.dim("─".repeat(50)));
        console.log(response);
        console.log();
    }
    catch (error) {
        s.stop(pc.red("AI query failed"));
        p.log.error(error.message || String(error));
        process.exit(1);
    }
}
async function buildContext(root) {
    const parts = [];
    // Product info
    const productPath = getProdmanPath(root, PRODMAN_FILES.product);
    if (existsSync(productPath)) {
        const content = readFileSync(productPath, "utf-8");
        parts.push("## Product Definition\n```yaml\n" + content + "\n```");
    }
    // Roadmap
    const roadmapPath = getProdmanPath(root, PRODMAN_FILES.roadmap);
    if (existsSync(roadmapPath)) {
        const content = readFileSync(roadmapPath, "utf-8");
        parts.push("## Roadmap\n```yaml\n" + content + "\n```");
    }
    // Epics
    const epics = readEpics(root);
    if (epics.length > 0) {
        parts.push("## Epics\n" +
            epics
                .map((e) => `- **${e.id}**: ${e.title} (${e.status}, ${e.priority})${e.description ? `\n  ${e.description.slice(0, 200)}` : ""}`)
                .join("\n"));
    }
    // Specs (summaries only)
    const specs = readSpecs(root);
    if (specs.length > 0) {
        parts.push("## Specs\n" +
            specs
                .map((s) => `- **${s.id}**: ${s.title} (${s.status})${s.epic ? ` [Epic: ${s.epic}]` : ""}`)
                .join("\n"));
    }
    return parts.join("\n\n");
}
async function queryAI(config, query, context) {
    const systemPrompt = `You are a helpful product management assistant for a software project. You have access to the project's product management data including:
- Product definition and vision
- Roadmap and milestones
- Epics and their status
- Specs and PRDs

Answer questions based on this context. Be concise but helpful. If you don't have enough information, say so.

## Project Context
${context}`;
    switch (config.ai?.provider) {
        case "anthropic": {
            const Anthropic = await import("@anthropic-ai/sdk").then((m) => m.default);
            const client = new Anthropic({ apiKey: config.ai.api_key });
            const message = await client.messages.create({
                model: config.ai.model || "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: "user", content: query }],
            });
            const textContent = message.content.find((c) => c.type === "text");
            return textContent?.text || "No response";
        }
        case "openai": {
            const OpenAI = await import("openai").then((m) => m.default);
            const client = new OpenAI({ apiKey: config.ai.api_key });
            const completion = await client.chat.completions.create({
                model: config.ai.model || "gpt-4o",
                max_tokens: 1024,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query },
                ],
            });
            return completion.choices[0]?.message?.content || "No response";
        }
        case "ollama": {
            const endpoint = config.ai.endpoint || "http://localhost:11434";
            const response = await fetch(`${endpoint}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: config.ai.model || "llama3.2",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: query },
                    ],
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.message?.content || "No response";
        }
        default:
            throw new Error(`Unsupported provider: ${config.ai?.provider}`);
    }
}
function readUserConfig() {
    if (!existsSync(USER_CONFIG_PATH))
        return null;
    try {
        const content = readFileSync(USER_CONFIG_PATH, "utf-8");
        return YAML.parse(content);
    }
    catch {
        return null;
    }
}
