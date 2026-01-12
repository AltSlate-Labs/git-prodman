import { z } from "zod";
export declare const SpecFrontmatterSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    epic: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "review", "approved", "implemented"]>>;
    author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "review" | "approved" | "implemented";
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    reviewers: string[];
    epic?: string | null | undefined;
    author?: string | null | undefined;
}, {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    status?: "draft" | "review" | "approved" | "implemented" | undefined;
    epic?: string | null | undefined;
    author?: string | null | undefined;
    reviewers?: string[] | undefined;
}>;
export type SpecFrontmatter = z.infer<typeof SpecFrontmatterSchema>;
export interface Spec extends SpecFrontmatter {
    content: string;
}
export declare function createSpecFrontmatter(id: string, title: string, overrides?: Partial<SpecFrontmatter>): SpecFrontmatter;
export declare function createSpecContent(title: string): string;
