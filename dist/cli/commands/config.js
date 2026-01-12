import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import YAML from "yaml";
import { findProdmanRoot, readConfig, getProdmanPath } from "../../core/fs.js";
import { PRODMAN_FILES, AI_PROVIDERS } from "../../core/constants.js";
import { UserConfigSchema } from "../../core/schemas/config.js";
const USER_CONFIG_PATH = join(homedir(), ".config", "prodman", "config.yaml");
export const configCommand = new Command("config")
    .description("Manage configuration");
// config show
configCommand
    .command("show")
    .description("Show current configuration")
    .option("--repo", "Show repo config only")
    .option("--user", "Show user config only")
    .action(async (options) => {
    console.log();
    // User config
    if (!options.repo) {
        console.log(pc.bold("User Configuration"));
        console.log(pc.dim(`Path: ${USER_CONFIG_PATH}`));
        console.log(pc.dim("─".repeat(40)));
        const userConfig = readUserConfig();
        if (userConfig) {
            console.log(YAML.stringify(userConfig));
        }
        else {
            console.log(pc.dim("Not configured yet. Run: prodman config set"));
        }
        console.log();
    }
    // Repo config
    if (!options.user) {
        const root = findProdmanRoot();
        if (root) {
            console.log(pc.bold("Repository Configuration"));
            console.log(pc.dim(`Path: ${getProdmanPath(root, PRODMAN_FILES.config)}`));
            console.log(pc.dim("─".repeat(40)));
            const repoConfig = readConfig(root);
            if (repoConfig) {
                console.log(YAML.stringify(repoConfig));
            }
        }
        else {
            console.log(pc.dim("Not in a git-prodman project."));
        }
    }
});
// config set (for AI provider)
configCommand
    .command("set")
    .description("Configure settings interactively")
    .action(async () => {
    p.intro(pc.bgCyan(pc.black(" git-prodman config ")));
    const currentConfig = readUserConfig() || {};
    const answers = await p.group({
        provider: () => p.select({
            message: "AI Provider",
            options: AI_PROVIDERS.map((p) => ({
                value: p,
                label: p.charAt(0).toUpperCase() + p.slice(1),
            })),
            initialValue: currentConfig.ai?.provider || "anthropic",
        }),
        apiKey: ({ results }) => p.text({
            message: `API Key for ${results.provider}`,
            placeholder: results.provider === "ollama"
                ? "(not required for Ollama)"
                : "sk-...",
            validate: (v) => {
                if (results.provider !== "ollama" && !v) {
                    return "API key is required";
                }
            },
        }),
        model: ({ results }) => p.text({
            message: "Model name (optional)",
            placeholder: getDefaultModel(results.provider),
        }),
        endpoint: ({ results }) => results.provider === "ollama"
            ? p.text({
                message: "Ollama endpoint",
                placeholder: "http://localhost:11434",
                initialValue: "http://localhost:11434",
            })
            : Promise.resolve(undefined),
    }, {
        onCancel: () => {
            p.cancel("Cancelled.");
            process.exit(0);
        },
    });
    const newConfig = {
        ai: {
            provider: answers.provider,
            api_key: answers.apiKey || undefined,
            model: answers.model || undefined,
            endpoint: answers.endpoint || undefined,
        },
        preferences: currentConfig.preferences || {
            editor: "code",
            theme: "dark",
            auto_commit_message: true,
        },
    };
    writeUserConfig(newConfig);
    p.outro(pc.green("✓ ") + `Configuration saved to ${pc.dim(USER_CONFIG_PATH)}`);
});
// provider subcommands
export const providerCommand = new Command("provider")
    .description("Manage AI provider");
providerCommand
    .command("set <provider>")
    .description("Set AI provider (openai, anthropic, ollama)")
    .action(async (provider) => {
    if (!AI_PROVIDERS.includes(provider)) {
        p.log.error(pc.red(`Invalid provider. Choose from: ${AI_PROVIDERS.join(", ")}`));
        process.exit(1);
    }
    const currentConfig = readUserConfig() || {};
    const newConfig = {
        ...currentConfig,
        ai: {
            ...currentConfig.ai,
            provider: provider,
        },
    };
    writeUserConfig(newConfig);
    p.log.success(pc.green(`AI provider set to: ${provider}`));
});
providerCommand
    .command("test")
    .description("Test AI provider connection")
    .action(async () => {
    const config = readUserConfig();
    if (!config?.ai?.provider) {
        p.log.error(pc.red("No AI provider configured. Run: prodman config set"));
        process.exit(1);
    }
    const s = p.spinner();
    s.start(`Testing connection to ${config.ai.provider}...`);
    try {
        // Simple test based on provider
        switch (config.ai.provider) {
            case "anthropic": {
                const Anthropic = await import("@anthropic-ai/sdk").then((m) => m.default);
                const client = new Anthropic({ apiKey: config.ai.api_key });
                await client.messages.create({
                    model: config.ai.model || "claude-3-haiku-20240307",
                    max_tokens: 10,
                    messages: [{ role: "user", content: "Hi" }],
                });
                break;
            }
            case "openai": {
                const OpenAI = await import("openai").then((m) => m.default);
                const client = new OpenAI({ apiKey: config.ai.api_key });
                await client.chat.completions.create({
                    model: config.ai.model || "gpt-3.5-turbo",
                    max_tokens: 10,
                    messages: [{ role: "user", content: "Hi" }],
                });
                break;
            }
            case "ollama": {
                const response = await fetch(`${config.ai.endpoint || "http://localhost:11434"}/api/tags`);
                if (!response.ok)
                    throw new Error("Ollama not reachable");
                break;
            }
        }
        s.stop(pc.green(`✓ Connected to ${config.ai.provider}`));
    }
    catch (error) {
        s.stop(pc.red(`✗ Failed to connect to ${config.ai.provider}`));
        p.log.error(error.message || String(error));
        process.exit(1);
    }
});
configCommand.addCommand(providerCommand);
// Helper functions
function readUserConfig() {
    if (!existsSync(USER_CONFIG_PATH))
        return null;
    try {
        const content = readFileSync(USER_CONFIG_PATH, "utf-8");
        const parsed = YAML.parse(content);
        return UserConfigSchema.parse(parsed);
    }
    catch {
        return null;
    }
}
function writeUserConfig(config) {
    const dir = dirname(USER_CONFIG_PATH);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    const content = `# git-prodman User Configuration\n` + YAML.stringify(config);
    writeFileSync(USER_CONFIG_PATH, content, "utf-8");
}
function getDefaultModel(provider) {
    switch (provider) {
        case "anthropic":
            return "claude-3-5-sonnet-20241022";
        case "openai":
            return "gpt-4o";
        case "ollama":
            return "llama3.2";
        default:
            return "";
    }
}
