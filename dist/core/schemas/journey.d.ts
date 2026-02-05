import { z } from "zod";
export declare const JourneyStepSchema: z.ZodObject<{
    order: z.ZodNumber;
    action: z.ZodString;
    touchpoint: z.ZodEnum<["cli", "web-ui", "docs", "api", "external", "notification"]>;
    emotion: z.ZodDefault<z.ZodOptional<z.ZodEnum<["frustrated", "confused", "neutral", "satisfied", "delighted"]>>>;
    pain_points: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    opportunities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    order: number;
    action: string;
    touchpoint: "cli" | "web-ui" | "docs" | "api" | "external" | "notification";
    emotion: "frustrated" | "confused" | "neutral" | "satisfied" | "delighted";
    pain_points: string[];
    opportunities: string[];
}, {
    order: number;
    action: string;
    touchpoint: "cli" | "web-ui" | "docs" | "api" | "external" | "notification";
    emotion?: "frustrated" | "confused" | "neutral" | "satisfied" | "delighted" | undefined;
    pain_points?: string[] | undefined;
    opportunities?: string[] | undefined;
}>;
export type JourneyStep = z.infer<typeof JourneyStepSchema>;
export declare const JourneyFrontmatterSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    persona: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    goal: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["draft", "validated", "implemented", "deprecated"]>>;
    priority: z.ZodDefault<z.ZodEnum<["p0", "p1", "p2", "p3"]>>;
    steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
        order: z.ZodNumber;
        action: z.ZodString;
        touchpoint: z.ZodEnum<["cli", "web-ui", "docs", "api", "external", "notification"]>;
        emotion: z.ZodDefault<z.ZodOptional<z.ZodEnum<["frustrated", "confused", "neutral", "satisfied", "delighted"]>>>;
        pain_points: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        opportunities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        order: number;
        action: string;
        touchpoint: "cli" | "web-ui" | "docs" | "api" | "external" | "notification";
        emotion: "frustrated" | "confused" | "neutral" | "satisfied" | "delighted";
        pain_points: string[];
        opportunities: string[];
    }, {
        order: number;
        action: string;
        touchpoint: "cli" | "web-ui" | "docs" | "api" | "external" | "notification";
        emotion?: "frustrated" | "confused" | "neutral" | "satisfied" | "delighted" | undefined;
        pain_points?: string[] | undefined;
        opportunities?: string[] | undefined;
    }>, "many">>;
    epics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    related_journeys: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    epics: string[];
    status: "draft" | "implemented" | "deprecated" | "validated";
    id: string;
    title: string;
    priority: "p0" | "p1" | "p2" | "p3";
    created_at: string;
    updated_at: string;
    goal: string;
    steps: {
        order: number;
        action: string;
        touchpoint: "cli" | "web-ui" | "docs" | "api" | "external" | "notification";
        emotion: "frustrated" | "confused" | "neutral" | "satisfied" | "delighted";
        pain_points: string[];
        opportunities: string[];
    }[];
    related_journeys: string[];
    author?: string | null | undefined;
    persona?: string | null | undefined;
}, {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    epics?: string[] | undefined;
    status?: "draft" | "implemented" | "deprecated" | "validated" | undefined;
    priority?: "p0" | "p1" | "p2" | "p3" | undefined;
    author?: string | null | undefined;
    persona?: string | null | undefined;
    goal?: string | undefined;
    steps?: {
        order: number;
        action: string;
        touchpoint: "cli" | "web-ui" | "docs" | "api" | "external" | "notification";
        emotion?: "frustrated" | "confused" | "neutral" | "satisfied" | "delighted" | undefined;
        pain_points?: string[] | undefined;
        opportunities?: string[] | undefined;
    }[] | undefined;
    related_journeys?: string[] | undefined;
}>;
export type JourneyFrontmatter = z.infer<typeof JourneyFrontmatterSchema>;
export interface Journey extends JourneyFrontmatter {
    content: string;
}
export declare function createJourneyFrontmatter(id: string, title: string, overrides?: Partial<JourneyFrontmatter>): JourneyFrontmatter;
export declare function createJourneyContent(title: string): string;
