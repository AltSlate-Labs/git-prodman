import { z } from "zod";
export declare const DecisionFrontmatterSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["proposed", "accepted", "rejected", "superseded", "deprecated"]>>;
    date: z.ZodString;
    deciders: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    supersedes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    superseded_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "proposed" | "accepted" | "rejected" | "superseded" | "deprecated";
    date: string;
    id: string;
    title: string;
    deciders: string[];
    supersedes?: string | null | undefined;
    superseded_by?: string | null | undefined;
}, {
    date: string;
    id: string;
    title: string;
    status?: "proposed" | "accepted" | "rejected" | "superseded" | "deprecated" | undefined;
    deciders?: string[] | undefined;
    supersedes?: string | null | undefined;
    superseded_by?: string | null | undefined;
}>;
export type DecisionFrontmatter = z.infer<typeof DecisionFrontmatterSchema>;
export interface Decision extends DecisionFrontmatter {
    content: string;
}
export declare function createDecisionFrontmatter(id: string, title: string, overrides?: Partial<DecisionFrontmatter>): DecisionFrontmatter;
export declare function createDecisionContent(title: string): string;
