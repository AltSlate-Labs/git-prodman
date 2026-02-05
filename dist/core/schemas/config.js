import { z } from "zod";
export const RepoConfigSchema = z.object({
    schema_version: z.number().default(1),
    project: z.object({
        name: z.string(),
        description: z.string().optional(),
        default_branch: z.string().default("main"),
    }),
    sync: z
        .object({
        remote: z.string().default("origin"),
        auto_push: z.boolean().default(false),
        branch_strategy: z.enum(["direct", "pr"]).default("direct"),
    })
        .optional(),
    integrations: z
        .object({
        github: z
            .object({
            enabled: z.boolean().default(false),
            sync_issues: z
                .enum(["none", "import", "bidirectional"])
                .default("none"),
            sync_labels: z.boolean().default(false),
        })
            .optional(),
    })
        .optional(),
    templates: z
        .object({
        epic: z.string().optional(),
        spec: z.string().optional(),
        decision: z.string().optional(),
        journey: z.string().optional(),
    })
        .optional(),
    counters: z
        .object({
        epic: z.number().default(0),
        spec: z.number().default(0),
        decision: z.number().default(0),
        issue: z.number().default(0),
        journey: z.number().default(0),
    })
        .optional(),
});
export const UserConfigSchema = z.object({
    ai: z
        .object({
        provider: z.enum(["openai", "anthropic", "ollama"]).default("anthropic"),
        model: z.string().optional(),
        api_key: z.string().optional(),
        endpoint: z.string().optional(),
    })
        .optional(),
    preferences: z
        .object({
        editor: z.string().default("code"),
        theme: z.enum(["dark", "light"]).default("dark"),
        auto_commit_message: z.boolean().default(true),
    })
        .optional(),
});
