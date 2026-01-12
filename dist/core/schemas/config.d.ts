import { z } from "zod";
export declare const RepoConfigSchema: z.ZodObject<{
    schema_version: z.ZodDefault<z.ZodNumber>;
    project: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        default_branch: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        default_branch: string;
        description?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
        default_branch?: string | undefined;
    }>;
    sync: z.ZodOptional<z.ZodObject<{
        remote: z.ZodDefault<z.ZodString>;
        auto_push: z.ZodDefault<z.ZodBoolean>;
        branch_strategy: z.ZodDefault<z.ZodEnum<["direct", "pr"]>>;
    }, "strip", z.ZodTypeAny, {
        remote: string;
        auto_push: boolean;
        branch_strategy: "direct" | "pr";
    }, {
        remote?: string | undefined;
        auto_push?: boolean | undefined;
        branch_strategy?: "direct" | "pr" | undefined;
    }>>;
    integrations: z.ZodOptional<z.ZodObject<{
        github: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            sync_issues: z.ZodDefault<z.ZodEnum<["none", "import", "bidirectional"]>>;
            sync_labels: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            sync_issues: "none" | "import" | "bidirectional";
            sync_labels: boolean;
        }, {
            enabled?: boolean | undefined;
            sync_issues?: "none" | "import" | "bidirectional" | undefined;
            sync_labels?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        github?: {
            enabled: boolean;
            sync_issues: "none" | "import" | "bidirectional";
            sync_labels: boolean;
        } | undefined;
    }, {
        github?: {
            enabled?: boolean | undefined;
            sync_issues?: "none" | "import" | "bidirectional" | undefined;
            sync_labels?: boolean | undefined;
        } | undefined;
    }>>;
    templates: z.ZodOptional<z.ZodObject<{
        epic: z.ZodOptional<z.ZodString>;
        spec: z.ZodOptional<z.ZodString>;
        decision: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        epic?: string | undefined;
        spec?: string | undefined;
        decision?: string | undefined;
    }, {
        epic?: string | undefined;
        spec?: string | undefined;
        decision?: string | undefined;
    }>>;
    counters: z.ZodOptional<z.ZodObject<{
        epic: z.ZodDefault<z.ZodNumber>;
        spec: z.ZodDefault<z.ZodNumber>;
        decision: z.ZodDefault<z.ZodNumber>;
        issue: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        epic: number;
        spec: number;
        decision: number;
        issue: number;
    }, {
        epic?: number | undefined;
        spec?: number | undefined;
        decision?: number | undefined;
        issue?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    schema_version: number;
    project: {
        name: string;
        default_branch: string;
        description?: string | undefined;
    };
    templates?: {
        epic?: string | undefined;
        spec?: string | undefined;
        decision?: string | undefined;
    } | undefined;
    sync?: {
        remote: string;
        auto_push: boolean;
        branch_strategy: "direct" | "pr";
    } | undefined;
    integrations?: {
        github?: {
            enabled: boolean;
            sync_issues: "none" | "import" | "bidirectional";
            sync_labels: boolean;
        } | undefined;
    } | undefined;
    counters?: {
        epic: number;
        spec: number;
        decision: number;
        issue: number;
    } | undefined;
}, {
    project: {
        name: string;
        description?: string | undefined;
        default_branch?: string | undefined;
    };
    templates?: {
        epic?: string | undefined;
        spec?: string | undefined;
        decision?: string | undefined;
    } | undefined;
    schema_version?: number | undefined;
    sync?: {
        remote?: string | undefined;
        auto_push?: boolean | undefined;
        branch_strategy?: "direct" | "pr" | undefined;
    } | undefined;
    integrations?: {
        github?: {
            enabled?: boolean | undefined;
            sync_issues?: "none" | "import" | "bidirectional" | undefined;
            sync_labels?: boolean | undefined;
        } | undefined;
    } | undefined;
    counters?: {
        epic?: number | undefined;
        spec?: number | undefined;
        decision?: number | undefined;
        issue?: number | undefined;
    } | undefined;
}>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export declare const UserConfigSchema: z.ZodObject<{
    ai: z.ZodOptional<z.ZodObject<{
        provider: z.ZodDefault<z.ZodEnum<["openai", "anthropic", "ollama"]>>;
        model: z.ZodOptional<z.ZodString>;
        api_key: z.ZodOptional<z.ZodString>;
        endpoint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider: "openai" | "anthropic" | "ollama";
        model?: string | undefined;
        api_key?: string | undefined;
        endpoint?: string | undefined;
    }, {
        provider?: "openai" | "anthropic" | "ollama" | undefined;
        model?: string | undefined;
        api_key?: string | undefined;
        endpoint?: string | undefined;
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        editor: z.ZodDefault<z.ZodString>;
        theme: z.ZodDefault<z.ZodEnum<["dark", "light"]>>;
        auto_commit_message: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        editor: string;
        theme: "dark" | "light";
        auto_commit_message: boolean;
    }, {
        editor?: string | undefined;
        theme?: "dark" | "light" | undefined;
        auto_commit_message?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    ai?: {
        provider: "openai" | "anthropic" | "ollama";
        model?: string | undefined;
        api_key?: string | undefined;
        endpoint?: string | undefined;
    } | undefined;
    preferences?: {
        editor: string;
        theme: "dark" | "light";
        auto_commit_message: boolean;
    } | undefined;
}, {
    ai?: {
        provider?: "openai" | "anthropic" | "ollama" | undefined;
        model?: string | undefined;
        api_key?: string | undefined;
        endpoint?: string | undefined;
    } | undefined;
    preferences?: {
        editor?: string | undefined;
        theme?: "dark" | "light" | undefined;
        auto_commit_message?: boolean | undefined;
    } | undefined;
}>;
export type UserConfig = z.infer<typeof UserConfigSchema>;
