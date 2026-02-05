import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { homedir } from "os";
import YAML from "yaml";
import matter from "gray-matter";
import {
  findProdmanRoot,
  readConfig,
  readEpics,
  readSpecs,
  writeSpec,
  getProdmanPath,
  readIssues,
  writeEpic,
  writeIssue,
  readJourneys,
  writeJourney,
} from "../../core/fs.js";
import { VERSION, PRODMAN_FILES } from "../../core/constants.js";
import {
  getGitStatus,
  commitChange,
  generateCommitMessage,
  getConflicts,
  resolveConflict,
} from "../../core/git.js";
import type { UserConfig } from "../../core/schemas/config.js";
import type { Spec } from "../../core/schemas/spec.js";
import type { Epic } from "../../core/schemas/epic.js";
import type { Issue } from "../../core/schemas/issue.js";
import type { Journey } from "../../core/schemas/journey.js";

const USER_CONFIG_PATH = join(homedir(), ".config", "prodman", "config.yaml");

export const uiCommand = new Command("ui")
  .description("Start the web UI")
  .option("-p, --port <port>", "Port to run on", "3333")
  .option("--no-open", "Don't open browser automatically")
  .action(async (options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project. Run 'prodman init' first."));
      process.exit(1);
    }

    const config = readConfig(root);
    const port = parseInt(options.port, 10);

    p.intro(pc.bgCyan(pc.black(" git-prodman ui ")));
    p.log.info(`${pc.dim("Project:")} ${config?.project.name || "Unknown"}`);
    p.log.info(`${pc.dim("Root:")} ${root}`);

    const app = createApp(root);

    serve({ fetch: app.fetch, port });

    console.log();
    p.log.success(pc.green(`🚀 git-prodman running at ${pc.cyan(`http://localhost:${port}`)}`));
    p.log.info(pc.dim("Press Ctrl+C to stop"));
    console.log();

    if (options.open !== false) {
      const open = await import("open").then((m) => m.default).catch(() => null);
      if (open) await open(`http://localhost:${port}`);
    }

    process.on("SIGINT", () => {
      console.log();
      p.outro("Stopped.");
      process.exit(0);
    });
  });

// Build file tree recursively
interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

function buildFileTree(dir: string, basePath: string): FileNode[] {
  if (!existsSync(dir)) return [];
  
  const items = readdirSync(dir);
  const nodes: FileNode[] = [];
  
  for (const item of items) {
    if (item.startsWith(".")) continue;
    const fullPath = join(dir, item);
    const relPath = join(basePath, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      nodes.push({
        name: item,
        path: relPath,
        type: "directory",
        children: buildFileTree(fullPath, relPath),
      });
    } else {
      nodes.push({ name: item, path: relPath, type: "file" });
    }
  }
  
  // Sort: directories first, then files
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function createApp(root: string): Hono {
  const app = new Hono();

  // API Routes
  app.get("/api/status", (c) => {
    const config = readConfig(root);
    return c.json({ version: VERSION, project: config?.project, root });
  });

  app.get("/api/epics", (c) => c.json(readEpics(root)));

  app.get("/api/epics/:id", (c) => {
    const epics = readEpics(root);
    const epic = epics.find((e) => e.id === c.req.param("id").toUpperCase());
    if (!epic) return c.json({ error: "Epic not found" }, 404);
    return c.json(epic);
  });

  // Issues API
  app.get("/api/issues", (c) => c.json(readIssues(root)));

  app.get("/api/issues/:id", (c) => {
    const issues = readIssues(root);
    const issue = issues.find((i) => i.id.toUpperCase() === c.req.param("id").toUpperCase());
    if (!issue) return c.json({ error: "Issue not found" }, 404);
    return c.json(issue);
  });

  app.get("/api/specs", (c) => c.json(readSpecs(root)));

  app.get("/api/specs/:id", (c) => {
    const specs = readSpecs(root);
    const spec = specs.find((s) => s.id.toUpperCase() === c.req.param("id").toUpperCase());
    if (!spec) return c.json({ error: "Spec not found" }, 404);
    return c.json(spec);
  });

  // Save spec with auto-commit
  app.put("/api/specs/:id", async (c) => {
    try {
      const id = c.req.param("id").toUpperCase();
      const body = await c.req.json();
      const specs = readSpecs(root);
      const existing = specs.find((s) => s.id.toUpperCase() === id);
      if (!existing) return c.json({ error: "Spec not found" }, 404);

      const updated: Spec = {
        ...existing,
        title: body.title || existing.title,
        content: body.content ?? existing.content,
        status: body.status || existing.status,
        epic: body.epic !== undefined ? body.epic : existing.epic,
        author: body.author !== undefined ? body.author : existing.author,
        updated_at: new Date().toISOString().split("T")[0],
      };

      const filepath = writeSpec(root, updated);
      const relPath = filepath.replace(root + "/", "");

      try {
        const msg = generateCommitMessage(relPath, "update");
        commitChange(root, relPath, msg);
      } catch {}

      return c.json({ success: true, spec: updated });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // Save epic with auto-commit (for Kanban)
  app.put("/api/epics/:id", async (c) => {
    try {
      const id = c.req.param("id").toUpperCase();
      const body = await c.req.json();
      const epics = readEpics(root);
      const existing = epics.find((e) => e.id.toUpperCase() === id);
      if (!existing) return c.json({ error: "Epic not found" }, 404);

      const updated: Epic = {
        ...existing,
        status: body.status || existing.status,
        priority: body.priority || existing.priority,
        owner: body.owner !== undefined ? body.owner : existing.owner,
        milestone: body.milestone !== undefined ? body.milestone : existing.milestone,
        updated_at: new Date().toISOString().split("T")[0],
      };

      const filepath = writeEpic(root, updated);
      const relPath = filepath.replace(root + "/", "");

      try {
        const msg = generateCommitMessage(relPath, "update");
        commitChange(root, relPath, msg);
      } catch {}

      return c.json({ success: true, epic: updated });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // Save issue with auto-commit (for Kanban)
  app.put("/api/issues/:id", async (c) => {
    try {
      const id = c.req.param("id").toUpperCase();
      const body = await c.req.json();
      const issues = readIssues(root);
      const existing = issues.find((i) => i.id.toUpperCase() === id);
      if (!existing) return c.json({ error: "Issue not found" }, 404);

      const updated: Issue = {
        ...existing,
        status: body.status || existing.status,
        priority: body.priority || existing.priority,
        assignee: body.assignee !== undefined ? body.assignee : existing.assignee,
        epic: body.epic !== undefined ? body.epic : existing.epic,
        updated_at: new Date().toISOString().split("T")[0],
      };

      const filepath = writeIssue(root, updated);
      const relPath = filepath.replace(root + "/", "");

      try {
        const msg = generateCommitMessage(relPath, "update");
        commitChange(root, relPath, msg);
      } catch {}

      return c.json({ success: true, issue: updated });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // Journeys API
  app.get("/api/journeys", (c) => c.json(readJourneys(root)));

  app.get("/api/journeys/:id", (c) => {
    const journeys = readJourneys(root);
    const journey = journeys.find((j) => j.id.toUpperCase() === c.req.param("id").toUpperCase());
    if (!journey) return c.json({ error: "Journey not found" }, 404);
    return c.json(journey);
  });

  app.put("/api/journeys/:id", async (c) => {
    try {
      const id = c.req.param("id").toUpperCase();
      const body = await c.req.json();
      const journeys = readJourneys(root);
      const existing = journeys.find((j) => j.id.toUpperCase() === id);
      if (!existing) return c.json({ error: "Journey not found" }, 404);

      const updated: Journey = {
        ...existing,
        title: body.title || existing.title,
        content: body.content ?? existing.content,
        status: body.status || existing.status,
        priority: body.priority || existing.priority,
        persona: body.persona !== undefined ? body.persona : existing.persona,
        goal: body.goal !== undefined ? body.goal : existing.goal,
        steps: body.steps || existing.steps,
        epics: body.epics || existing.epics,
        updated_at: new Date().toISOString().split("T")[0],
      };

      const filepath = writeJourney(root, updated);
      const relPath = filepath.replace(root + "/", "");

      try {
        const msg = generateCommitMessage(relPath, "update");
        commitChange(root, relPath, msg);
      } catch {}

      return c.json({ success: true, journey: updated });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // Git status API
  app.get("/api/git/status", (c) => c.json(getGitStatus(root)));

  // Conflicts API
  app.get("/api/git/conflicts", (c) => {
    const conflicts = getConflicts(root);
    return c.json({ conflicts });
  });

  // Resolve conflict API
  app.post("/api/git/resolve", async (c) => {
    try {
      const { file, resolution } = await c.req.json();
      resolveConflict(root, file, resolution);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // File tree API
  app.get("/api/files", (c) => {
    const prodmanDir = getProdmanPath(root, "");
    const tree = buildFileTree(prodmanDir, ".prodman");
    return c.json(tree);
  });

  // Read file API
  app.get("/api/files/*", (c) => {
    const filePath = c.req.path.replace("/api/files/", "");
    const fullPath = join(root, filePath);
    
    if (!existsSync(fullPath)) return c.json({ error: "File not found" }, 404);
    if (!fullPath.includes(".prodman")) return c.json({ error: "Forbidden" }, 403);
    
    const content = readFileSync(fullPath, "utf-8");
    const isYaml = filePath.endsWith(".yaml");
    const isMd = filePath.endsWith(".md");
    
    return c.json({ path: filePath, content, type: isYaml ? "yaml" : isMd ? "markdown" : "text" });
  });

  // AI Chat with SSE streaming
  app.post("/api/chat", async (c) => {
    const userConfig = readUserConfig();
    if (!userConfig?.ai?.provider) {
      return c.json({ error: "No AI provider configured" }, 400);
    }

    const { message } = await c.req.json();
    const context = await buildContext(root);

    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return stream(c, async (s) => {
      try {
        await streamAIResponse(userConfig, message, context, async (chunk) => {
          await s.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        });
        await s.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      } catch (e: any) {
        await s.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      }
    });
  });

  // Roadmap API
  app.get("/api/roadmap", (c) => {
    const roadmapPath = getProdmanPath(root, PRODMAN_FILES.roadmap);
    if (!existsSync(roadmapPath)) return c.json({ milestones: [] });
    return c.json(YAML.parse(readFileSync(roadmapPath, "utf-8")));
  });

  app.get("/", (c) => c.html(getDashboardHTML(root)));
  app.get("*", (c) => c.html(getDashboardHTML(root)));

  return app;
}

async function buildContext(root: string): Promise<string> {
  const parts: string[] = [];

  const productPath = getProdmanPath(root, PRODMAN_FILES.product);
  if (existsSync(productPath)) {
    parts.push("## Product Definition\n```yaml\n" + readFileSync(productPath, "utf-8") + "\n```");
  }

  const roadmapPath = getProdmanPath(root, PRODMAN_FILES.roadmap);
  if (existsSync(roadmapPath)) {
    parts.push("## Roadmap\n```yaml\n" + readFileSync(roadmapPath, "utf-8") + "\n```");
  }

  const epics = readEpics(root);
  if (epics.length > 0) {
    parts.push("## Epics\n" + epics.map((e) =>
      `- **${e.id}**: ${e.title} (${e.status}, ${e.priority})${e.description ? `\n  ${e.description.slice(0, 200)}` : ""}`
    ).join("\n"));
  }

  const specs = readSpecs(root);
  if (specs.length > 0) {
    parts.push("## Specs\n" + specs.map((s) =>
      `- **${s.id}**: ${s.title} (${s.status})${s.epic ? ` [Epic: ${s.epic}]` : ""}`
    ).join("\n"));
  }

  return parts.join("\n\n");
}

async function streamAIResponse(
  config: UserConfig,
  query: string,
  context: string,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  const systemPrompt = `You are a helpful product management assistant. Be concise.\n\n## Project Context\n${context}`;

  switch (config.ai?.provider) {
    case "anthropic": {
      const Anthropic = await import("@anthropic-ai/sdk").then((m) => m.default);
      const client = new Anthropic({ apiKey: config.ai.api_key });
      const stream = await client.messages.stream({
        model: config.ai.model || "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: query }],
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          await onChunk(event.delta.text);
        }
      }
      break;
    }
    case "openai": {
      const OpenAI = await import("openai").then((m) => m.default);
      const client = new OpenAI({ apiKey: config.ai.api_key });
      const stream = await client.chat.completions.create({
        model: config.ai.model || "gpt-4o",
        max_tokens: 1024,
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) await onChunk(content);
      }
      break;
    }
    case "ollama": {
      const endpoint = config.ai.endpoint || "http://localhost:11434";
      const response = await fetch(`${endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.ai.model || "llama3.2",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
          stream: true,
        }),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n").filter(Boolean)) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) await onChunk(data.message.content);
          } catch {}
        }
      }
      break;
    }
    default:
      throw new Error(`Unsupported provider: ${config.ai?.provider}`);
  }
}

function readUserConfig(): UserConfig | null {
  if (!existsSync(USER_CONFIG_PATH)) return null;
  try {
    return YAML.parse(readFileSync(USER_CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function getDashboardHTML(root: string): string {
  const config = readConfig(root);
  const epics = readEpics(root);
  const specs = readSpecs(root);
  const gitStatus = getGitStatus(root);

  let roadmap: any = { milestones: [] };
  const roadmapPath = getProdmanPath(root, PRODMAN_FILES.roadmap);
  if (existsSync(roadmapPath)) {
    roadmap = YAML.parse(readFileSync(roadmapPath, "utf-8"));
  }

  const epicsByStatus = {
    planning: epics.filter((e) => e.status === "planning" || e.status === "planned").length,
    in_progress: epics.filter((e) => e.status === "in_progress").length,
    complete: epics.filter((e) => e.status === "complete").length,
  };

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>git-prodman | ${config?.project.name || "Dashboard"}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap">
  <style>
    :root {
      --bg-primary: #030712;
      --bg-secondary: #111827;
      --bg-tertiary: #1f2937;
      --text-primary: #f3f4f6;
      --text-secondary: #9ca3af;
      --text-muted: #6b7280;
      --border: #374151;
      --accent: #22d3ee;
    }
    [data-theme="light"] {
      --bg-primary: #ffffff;
      --bg-secondary: #f9fafb;
      --bg-tertiary: #f3f4f6;
      --text-primary: #111827;
      --text-secondary: #4b5563;
      --text-muted: #9ca3af;
      --border: #e5e7eb;
      --accent: #0891b2;
    }
    [x-cloak] { display: none !important; }
    body { font-family: 'Space Grotesk', sans-serif; background: var(--bg-primary); color: var(--text-primary); }
    code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
    .bg-base { background: var(--bg-primary); }
    .bg-card { background: var(--bg-secondary); }
    .bg-hover { background: var(--bg-tertiary); }
    .text-base { color: var(--text-primary); }
    .text-muted { color: var(--text-secondary); }
    .border-base { border-color: var(--border); }
    .prose { max-width: none; }
    .prose h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0; color: var(--text-primary); }
    .prose h2 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; }
    .prose h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; color: var(--text-secondary); }
    .prose p { margin: 0.5rem 0; color: var(--text-secondary); }
    .prose ul, .prose ol { margin: 0.5rem 0; padding-left: 1.5rem; color: var(--text-secondary); }
    .prose li { margin: 0.25rem 0; }
    .prose code { background: var(--bg-tertiary); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; color: #34d399; }
    .prose pre { background: var(--bg-tertiary); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 0.75rem 0; }
    .prose pre code { background: none; padding: 0; color: var(--text-primary); }
    .prose a { color: var(--accent); text-decoration: underline; }
    .prose blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; margin: 0.75rem 0; color: var(--text-secondary); font-style: italic; }
    .timeline-dot { width: 12px; height: 12px; border-radius: 50%; }
    .chat-msg { animation: fadeIn 0.2s ease-out; }
    .tree-item { cursor: pointer; user-select: none; }
    .tree-item:hover { background: var(--bg-tertiary); }
    .kanban-card { cursor: grab; }
    .kanban-card:active { cursor: grabbing; }
    .sortable-ghost { opacity: 0.4; background: var(--bg-tertiary); }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body class="min-h-screen">
  <div x-data="dashboard()" x-cloak>
    <!-- Header -->
    <header class="border-b border-base backdrop-blur-sm sticky top-0 z-50 px-6 py-4" style="background: var(--bg-secondary);">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-xl font-bold" style="background: linear-gradient(to right, #22d3ee, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">⚡ git-prodman</span>
          <span class="text-muted">|</span>
          <span class="text-base">${config?.project.name || "Project"}</span>
        </div>
        <div class="flex items-center gap-4">
          <!-- Theme Toggle -->
          <button @click="toggleTheme()" class="p-2 rounded-lg hover:bg-hover transition-colors" title="Toggle theme">
            <span x-show="theme === 'dark'">🌙</span>
            <span x-show="theme === 'light'">☀️</span>
          </button>
          <div x-show="gitStatus.uncommitted.length > 0" class="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border border-amber-800/50 rounded-lg">
            <span class="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <span class="text-amber-300 text-sm" x-text="gitStatus.uncommitted.length + ' uncommitted'"></span>
          </div>
          <span class="text-sm text-muted">v${VERSION}</span>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="border-b border-base px-6" style="background: var(--bg-secondary);">
      <div class="flex gap-1">
        <template x-for="t in ['dashboard', 'roadmap', 'epics', 'specs', 'journeys', 'kanban', 'files', 'ai']">
          <button
            @click="tab = t; if(t === 'specs') loadSpecs(); if(t === 'files') loadFiles(); if(t === 'kanban') loadKanban(); if(t === 'journeys') loadJourneys();"
            :class="tab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-muted hover:text-base'"
            class="px-4 py-3 border-b-2 text-sm font-medium transition-all capitalize"
            x-text="t === 'dashboard' ? '📊 Dashboard' : t === 'roadmap' ? '🗺️ Roadmap' : t === 'epics' ? '🎯 Epics' : t === 'specs' ? '📝 Specs' : t === 'journeys' ? '🚶 Journeys' : t === 'kanban' ? '📋 Kanban' : t === 'files' ? '📁 Files' : '🤖 AI'"
          ></button>
        </template>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="p-6">
      <!-- Dashboard Tab -->
      <div x-show="tab === 'dashboard'">
        <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-card rounded-xl p-5 border border-base">
            <div class="text-3xl font-bold text-cyan-400">${epics.length}</div>
            <div class="text-muted text-sm mt-1">Total Epics</div>
          </div>
          <div class="bg-card rounded-xl p-5 border border-base">
            <div class="text-3xl font-bold text-yellow-400">${epicsByStatus.in_progress}</div>
            <div class="text-muted text-sm mt-1">In Progress</div>
          </div>
          <div class="bg-card rounded-xl p-5 border border-base">
            <div class="text-3xl font-bold text-emerald-400">${epicsByStatus.complete}</div>
            <div class="text-muted text-sm mt-1">Complete</div>
          </div>
          <div class="bg-card rounded-xl p-5 border border-base">
            <div class="text-3xl font-bold text-purple-400">${specs.length}</div>
            <div class="text-muted text-sm mt-1">Specs</div>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-card rounded-xl border border-base p-5">
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><span class="text-orange-400">🔀</span> Git Status</h2>
            <div class="space-y-3">
              <div class="flex justify-between text-sm"><span class="text-muted">Branch</span><span class="font-mono text-cyan-400" x-text="gitStatus.branch || 'none'"></span></div>
              <div class="flex justify-between text-sm"><span class="text-muted">Uncommitted</span><span :class="gitStatus.uncommitted.length > 0 ? 'text-amber-400' : 'text-green-400'" x-text="gitStatus.uncommitted.length"></span></div>
              <div class="flex justify-between text-sm"><span class="text-muted">Unpushed</span><span :class="gitStatus.unpushedCount > 0 ? 'text-amber-400' : 'text-green-400'" x-text="gitStatus.unpushedCount"></span></div>
              <template x-if="gitStatus.uncommitted.length > 0">
                <div class="mt-4 p-3 bg-hover rounded-lg">
                  <div class="text-xs text-muted mb-2">Changed files:</div>
                  <template x-for="f in gitStatus.uncommitted.slice(0, 5)"><div class="text-xs font-mono text-muted truncate" x-text="f"></div></template>
                  <div x-show="gitStatus.uncommitted.length > 5" class="text-xs text-muted mt-1" x-text="'+ ' + (gitStatus.uncommitted.length - 5) + ' more'"></div>
                </div>
              </template>
            </div>
          </div>
          <div class="bg-card rounded-xl border border-base p-5">
            <h2 class="text-lg font-semibold mb-4">Recent Epics</h2>
            <div class="space-y-2">
              ${epics.slice(0, 5).map((epic) => `
              <div class="flex items-center justify-between py-2 border-b border-base last:border-0">
                <div class="flex items-center gap-3"><span class="text-cyan-400 font-mono text-sm">${epic.id}</span><span>${epic.title}</span></div>
                <span class="px-2 py-1 rounded text-xs ${getStatusClass(epic.status)}">${epic.status}</span>
              </div>`).join("")}
              ${epics.length === 0 ? '<div class="text-muted text-center py-4">No epics yet</div>' : ""}
            </div>
          </div>
        </div>
      </div>

      <!-- Roadmap Tab -->
      <div x-show="tab === 'roadmap'">
        <h1 class="text-2xl font-bold mb-6">Roadmap</h1>
        <div class="bg-card rounded-xl border border-base p-6">
          ${roadmap.milestones && roadmap.milestones.length > 0 ? `
          <div class="relative">
            <div class="absolute left-[5px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-emerald-500"></div>
            <div class="space-y-8">
              ${roadmap.milestones.map((m: any) => `
              <div class="relative pl-8">
                <div class="timeline-dot absolute left-0 top-1 ${m.status === 'complete' ? 'bg-emerald-400' : m.status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-600'} ring-4" style="ring-color: var(--bg-primary);"></div>
                <div class="bg-hover rounded-lg p-4 border border-base">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-lg">${m.version || m.name}</h3>
                    <span class="px-2 py-1 rounded text-xs ${m.status === 'complete' ? 'bg-emerald-900/50 text-emerald-300' : m.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-gray-700 text-gray-400'}">${m.status}</span>
                  </div>
                  <div class="text-sm text-muted mb-3">${m.start_date || ''} ${m.end_date ? '→ ' + m.end_date : ''}</div>
                  ${m.epics && m.epics.length > 0 ? `<div class="flex flex-wrap gap-2">${m.epics.map((e: string) => `<span class="px-2 py-1 bg-gray-700/50 rounded text-xs font-mono text-cyan-400">${e}</span>`).join("")}</div>` : ''}
                </div>
              </div>`).join("")}
            </div>
          </div>
          ` : '<div class="text-muted text-center py-8">No roadmap defined yet</div>'}
        </div>
      </div>

      <!-- Epics Tab -->
      <div x-show="tab === 'epics'">
        <h1 class="text-2xl font-bold mb-6">Epics</h1>
        <div class="bg-card rounded-xl border border-base overflow-hidden">
          <table class="w-full">
            <thead class="bg-hover"><tr>
              <th class="text-left px-4 py-3 text-sm font-medium text-muted">ID</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-muted">Title</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-muted">Status</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-muted">Priority</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-muted">Owner</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-800/50">
              ${epics.map((epic) => `
              <tr class="hover:bg-hover transition-colors">
                <td class="px-4 py-3 text-cyan-400 font-mono text-sm">${epic.id}</td>
                <td class="px-4 py-3">${epic.title}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 rounded text-xs ${getStatusClass(epic.status)}">${epic.status}</span></td>
                <td class="px-4 py-3 text-sm text-muted">${epic.priority}</td>
                <td class="px-4 py-3 text-sm text-muted">${epic.owner || "-"}</td>
              </tr>`).join("")}
            </tbody>
          </table>
          ${epics.length === 0 ? '<div class="text-muted text-center py-8">No epics yet</div>' : ""}
        </div>
      </div>

      <!-- Specs Tab -->
      <div x-show="tab === 'specs'">
        <div x-show="!editingSpec">
          <h1 class="text-2xl font-bold mb-6">Specs</h1>
          <div class="bg-card rounded-xl border border-base overflow-hidden">
            <table class="w-full">
              <thead class="bg-hover"><tr>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">ID</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Title</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Status</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Epic</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Actions</th>
              </tr></thead>
              <tbody class="divide-y divide-gray-800/50">
                <template x-for="spec in specs" :key="spec.id">
                  <tr class="hover:bg-hover transition-colors">
                    <td class="px-4 py-3 text-cyan-400 font-mono text-sm" x-text="spec.id"></td>
                    <td class="px-4 py-3" x-text="spec.title"></td>
                    <td class="px-4 py-3"><span class="px-2 py-1 rounded text-xs" :class="getSpecStatusClass(spec.status)" x-text="spec.status"></span></td>
                    <td class="px-4 py-3 text-sm text-muted" x-text="spec.epic || '-'"></td>
                    <td class="px-4 py-3"><button @click="openEditor(spec)" class="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors">Edit</button></td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div x-show="specs.length === 0" class="text-muted text-center py-8">No specs yet</div>
          </div>
        </div>
        <div x-show="editingSpec" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button @click="closeEditor()" class="text-muted hover:text-base transition-colors">← Back</button>
              <h1 class="text-xl font-bold" x-text="editingSpec?.title"></h1>
              <span class="px-2 py-1 rounded text-xs" :class="getSpecStatusClass(editingSpec?.status)" x-text="editingSpec?.status"></span>
            </div>
            <div class="flex items-center gap-3">
              <span x-show="saving" class="text-sm text-muted">Saving...</span>
              <span x-show="saved" class="text-sm text-emerald-400">✓ Saved & committed</span>
              <button @click="saveSpec()" :disabled="saving" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium transition-colors">Save</button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 h-[calc(100vh-220px)]">
            <div class="bg-card rounded-xl border border-base flex flex-col">
              <div class="px-4 py-2 border-b border-base text-sm text-muted">Edit</div>
              <textarea x-model="editorContent" @input="updatePreview()" class="flex-1 w-full bg-transparent p-4 text-base font-mono text-sm resize-none focus:outline-none" spellcheck="false"></textarea>
            </div>
            <div class="bg-card rounded-xl border border-base flex flex-col overflow-hidden">
              <div class="px-4 py-2 border-b border-base text-sm text-muted">Preview</div>
              <div class="flex-1 p-4 overflow-auto prose" x-html="previewHTML"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Journeys Tab -->
      <div x-show="tab === 'journeys'">
        <div x-show="!viewingJourney">
          <h1 class="text-2xl font-bold mb-6">User Journeys</h1>
          <div class="bg-card rounded-xl border border-base overflow-hidden">
            <table class="w-full">
              <thead class="bg-hover"><tr>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">ID</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Title</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Persona</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Status</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Steps</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-muted">Actions</th>
              </tr></thead>
              <tbody class="divide-y divide-gray-800/50">
                <template x-for="journey in journeys" :key="journey.id">
                  <tr class="hover:bg-hover transition-colors">
                    <td class="px-4 py-3 text-cyan-400 font-mono text-sm" x-text="journey.id"></td>
                    <td class="px-4 py-3" x-text="journey.title"></td>
                    <td class="px-4 py-3 text-sm text-muted" x-text="journey.persona || '-'"></td>
                    <td class="px-4 py-3"><span class="px-2 py-1 rounded text-xs" :class="getJourneyStatusClass(journey.status)" x-text="journey.status"></span></td>
                    <td class="px-4 py-3 text-sm text-muted" x-text="journey.steps?.length || 0"></td>
                    <td class="px-4 py-3"><button @click="openJourneyView(journey)" class="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors">View</button></td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div x-show="journeys.length === 0" class="text-muted text-center py-8">No journeys yet. Create one with: prodman journey create</div>
          </div>
        </div>
        <div x-show="viewingJourney" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button @click="closeJourneyView()" class="text-muted hover:text-base transition-colors">&larr; Back</button>
              <h1 class="text-xl font-bold" x-text="viewingJourney?.title"></h1>
              <span class="px-2 py-1 rounded text-xs" :class="getJourneyStatusClass(viewingJourney?.status)" x-text="viewingJourney?.status"></span>
            </div>
            <div class="flex items-center gap-3">
              <span x-show="journeySaving" class="text-sm text-muted">Saving...</span>
              <span x-show="journeySaved" class="text-sm text-emerald-400">Saved</span>
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-4">
              <!-- Journey Info -->
              <div class="bg-card rounded-xl border border-base p-5">
                <h2 class="text-lg font-semibold mb-4">Journey Details</h2>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div><span class="text-xs text-muted block mb-1">Persona</span><span x-text="viewingJourney?.persona || 'Not set'"></span></div>
                  <div><span class="text-xs text-muted block mb-1">Priority</span><span x-text="viewingJourney?.priority?.toUpperCase()"></span></div>
                </div>
                <div><span class="text-xs text-muted block mb-1">Goal</span><p class="text-sm" x-text="viewingJourney?.goal || 'No goal defined'"></p></div>
              </div>
              <!-- Journey Steps -->
              <div class="bg-card rounded-xl border border-base p-5">
                <h2 class="text-lg font-semibold mb-4">Journey Steps</h2>
                <div x-show="viewingJourney?.steps?.length > 0" class="space-y-3">
                  <template x-for="step in viewingJourney?.steps" :key="step.order">
                    <div class="flex items-start gap-4 p-3 bg-hover rounded-lg">
                      <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold" x-text="step.order"></div>
                      <div class="flex-1">
                        <div class="font-medium" x-text="step.action"></div>
                        <div class="flex items-center gap-3 mt-1 text-xs">
                          <span class="px-2 py-0.5 bg-gray-700 rounded" x-text="step.touchpoint"></span>
                          <span :class="getEmotionClass(step.emotion)" x-text="step.emotion"></span>
                        </div>
                        <div x-show="step.pain_points?.length > 0" class="mt-2"><span class="text-xs text-red-400">Pain points:</span><ul class="text-xs text-muted ml-4"><template x-for="pp in step.pain_points"><li x-text="pp"></li></template></ul></div>
                        <div x-show="step.opportunities?.length > 0" class="mt-2"><span class="text-xs text-green-400">Opportunities:</span><ul class="text-xs text-muted ml-4"><template x-for="opp in step.opportunities"><li x-text="opp"></li></template></ul></div>
                      </div>
                    </div>
                  </template>
                </div>
                <div x-show="!viewingJourney?.steps?.length" class="text-muted text-center py-4">No steps defined yet. Add steps with: prodman journey update --add-step</div>
              </div>
            </div>
            <div class="space-y-4">
              <!-- Linked Epics -->
              <div class="bg-card rounded-xl border border-base p-5">
                <h2 class="text-sm font-semibold mb-3 text-muted">Linked Epics</h2>
                <div x-show="viewingJourney?.epics?.length > 0" class="space-y-2">
                  <template x-for="epicId in viewingJourney?.epics" :key="epicId">
                    <div class="px-3 py-2 bg-hover rounded text-sm font-mono text-cyan-400" x-text="epicId"></div>
                  </template>
                </div>
                <div x-show="!viewingJourney?.epics?.length" class="text-muted text-sm">No linked epics</div>
              </div>
              <!-- Quick Edit -->
              <div class="bg-card rounded-xl border border-base p-5">
                <h2 class="text-sm font-semibold mb-3 text-muted">Quick Edit</h2>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-muted block mb-1">Status</label>
                    <select x-model="viewingJourney.status" @change="saveJourney()" class="w-full bg-hover border border-base rounded-lg px-3 py-2 text-sm">
                      <option value="draft">Draft</option>
                      <option value="validated">Validated</option>
                      <option value="implemented">Implemented</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs text-muted block mb-1">Priority</label>
                    <select x-model="viewingJourney.priority" @change="saveJourney()" class="w-full bg-hover border border-base rounded-lg px-3 py-2 text-sm">
                      <option value="p0">P0 - Critical</option>
                      <option value="p1">P1 - High</option>
                      <option value="p2">P2 - Medium</option>
                      <option value="p3">P3 - Low</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Files Tab -->
      <div x-show="tab === 'files'">
        <h1 class="text-2xl font-bold mb-6">File Explorer</h1>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-card rounded-xl border border-base p-4">
            <h2 class="text-sm font-medium text-muted mb-4">.prodman/</h2>
            <div class="space-y-1" x-show="fileTree.length > 0">
              <template x-for="node in fileTree" :key="node.path">
                <div x-data="{ open: true }">
                  <div @click="node.type === 'directory' ? open = !open : viewFile(node.path)" class="tree-item flex items-center gap-2 px-2 py-1.5 rounded text-sm" :class="selectedFile === node.path ? 'bg-cyan-600/20 text-cyan-400' : ''">
                    <span x-text="node.type === 'directory' ? (open ? '📂' : '📁') : (node.name.endsWith('.yaml') ? '📄' : '📝')"></span>
                    <span x-text="node.name"></span>
                  </div>
                  <div x-show="node.type === 'directory' && open" class="ml-4">
                    <template x-for="child in node.children" :key="child.path">
                      <div @click="child.type === 'file' && viewFile(child.path)" class="tree-item flex items-center gap-2 px-2 py-1.5 rounded text-sm" :class="selectedFile === child.path ? 'bg-cyan-600/20 text-cyan-400' : ''">
                        <span x-text="child.name.endsWith('.yaml') ? '📄' : '📝'"></span>
                        <span x-text="child.name"></span>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>
            <div x-show="fileTree.length === 0" class="text-muted text-center py-8">Loading...</div>
          </div>
          <div class="bg-card rounded-xl border border-base flex flex-col h-[calc(100vh-280px)]">
            <div class="px-4 py-2 border-b border-base text-sm text-muted" x-text="selectedFile || 'Select a file'"></div>
            <pre class="flex-1 p-4 overflow-auto text-sm font-mono text-muted"><code x-text="fileContent"></code></pre>
          </div>
        </div>
      </div>

      <!-- Kanban Tab -->
      <div x-show="tab === 'kanban'">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold">Kanban Board</h1>
          <div class="flex items-center gap-3">
            <div class="flex gap-1 bg-card rounded-lg p-1 border border-base">
              <button @click="kanbanView = 'epics'; loadKanban();" :class="kanbanView === 'epics' ? 'bg-cyan-600 text-white' : 'text-muted hover:text-base'" class="px-3 py-1.5 rounded text-sm font-medium transition-colors">Epics</button>
              <button @click="kanbanView = 'issues'; loadKanban();" :class="kanbanView === 'issues' ? 'bg-cyan-600 text-white' : 'text-muted hover:text-base'" class="px-3 py-1.5 rounded text-sm font-medium transition-colors">Issues</button>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex gap-3 mb-6">
          <select x-model="kanbanFilters.priority" @change="$nextTick(() => initKanbanDragDrop())" class="bg-card border border-base rounded-lg px-3 py-2 text-sm">
            <option value="">All Priorities</option>
            <option value="p0">P0 - Critical</option>
            <option value="p1">P1 - High</option>
            <option value="p2">P2 - Medium</option>
            <option value="p3">P3 - Low</option>
          </select>
          <select x-model="kanbanFilters.milestone" @change="$nextTick(() => initKanbanDragDrop())" class="bg-card border border-base rounded-lg px-3 py-2 text-sm">
            <option value="">All Milestones</option>
            <template x-for="m in kanbanMilestones" :key="m">
              <option :value="m" x-text="m"></option>
            </template>
          </select>
          <button @click="kanbanFilters = { priority: '', milestone: '' }; $nextTick(() => initKanbanDragDrop());" class="px-3 py-2 text-sm text-muted hover:text-base transition-colors">Clear Filters</button>
        </div>

        <!-- Epic Columns -->
        <div x-show="kanbanView === 'epics'" class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <template x-for="status in ['planned', 'planning', 'in_progress', 'complete', 'cancelled']" :key="status">
            <div class="bg-card rounded-xl border border-base flex flex-col">
              <div class="px-4 py-3 border-b border-base flex items-center justify-between">
                <span class="text-sm font-semibold capitalize" x-text="status.replace('_', ' ')"></span>
                <span class="px-2 py-0.5 rounded-full text-xs bg-hover" x-text="getFilteredKanbanItems(status).length"></span>
              </div>
              <div :data-status="status" class="kanban-column flex-1 p-3 space-y-3 min-h-[200px]">
                <template x-for="epic in getFilteredKanbanItems(status)" :key="epic.id">
                  <div :data-id="epic.id" @click="openKanbanDetail(epic)" class="kanban-card bg-hover rounded-lg p-3 border border-base cursor-pointer hover:border-cyan-500 transition-all">
                    <div class="flex items-start justify-between mb-2">
                      <span class="text-cyan-400 font-mono text-xs" x-text="epic.id"></span>
                      <span :class="getPriorityBadgeClass(epic.priority)" class="px-2 py-0.5 rounded text-xs font-medium" x-text="epic.priority.toUpperCase()"></span>
                    </div>
                    <div class="text-sm font-medium mb-2 line-clamp-2" x-text="epic.title"></div>
                    <div class="flex items-center justify-between text-xs text-muted">
                      <span x-text="epic.milestone || 'No milestone'"></span>
                      <span x-show="epic.owner" x-text="epic.owner"></span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- Issue Columns -->
        <div x-show="kanbanView === 'issues'" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <template x-for="status in ['open', 'in_progress', 'resolved', 'closed']" :key="status">
            <div class="bg-card rounded-xl border border-base flex flex-col">
              <div class="px-4 py-3 border-b border-base flex items-center justify-between">
                <span class="text-sm font-semibold capitalize" x-text="status.replace('_', ' ')"></span>
                <span class="px-2 py-0.5 rounded-full text-xs bg-hover" x-text="getFilteredKanbanItems(status).length"></span>
              </div>
              <div :data-status="status" class="kanban-column flex-1 p-3 space-y-3 min-h-[200px]">
                <template x-for="issue in getFilteredKanbanItems(status)" :key="issue.id">
                  <div :data-id="issue.id" @click="openKanbanDetail(issue)" class="kanban-card bg-hover rounded-lg p-3 border border-base cursor-pointer hover:border-cyan-500 transition-all">
                    <div class="flex items-start justify-between mb-2">
                      <span class="text-cyan-400 font-mono text-xs" x-text="issue.id"></span>
                      <span :class="getPriorityBadgeClass(issue.priority)" class="px-2 py-0.5 rounded text-xs font-medium" x-text="issue.priority.toUpperCase()"></span>
                    </div>
                    <div class="text-sm font-medium mb-2 line-clamp-2" x-text="issue.title"></div>
                    <div class="flex items-center justify-between text-xs text-muted">
                      <span x-show="issue.epic" x-text="issue.epic"></span>
                      <span x-show="issue.assignee" x-text="issue.assignee"></span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Kanban Detail Modal -->
      <div x-show="kanbanDetailOpen" @click.self="kanbanDetailOpen = false" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" style="display: none;">
        <div @click.stop class="bg-card rounded-xl border border-base max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
          <template x-if="kanbanDetailItem">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <span class="text-cyan-400 font-mono text-sm" x-text="kanbanDetailItem.id"></span>
                  <h2 class="text-xl font-bold" x-text="kanbanDetailItem.title"></h2>
                </div>
                <button @click="kanbanDetailOpen = false" class="text-muted hover:text-base text-xl">&times;</button>
              </div>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="text-xs text-muted block mb-1">Status</label>
                  <select x-model="kanbanDetailItem.status" class="w-full bg-hover border border-base rounded-lg px-3 py-2 text-sm">
                    <template x-if="kanbanView === 'epics'">
                      <template x-for="s in ['planned', 'planning', 'in_progress', 'complete', 'cancelled']">
                        <option :value="s" x-text="s.replace('_', ' ')" class="capitalize"></option>
                      </template>
                    </template>
                    <template x-if="kanbanView === 'issues'">
                      <template x-for="s in ['open', 'in_progress', 'resolved', 'closed', 'wontfix']">
                        <option :value="s" x-text="s.replace('_', ' ')" class="capitalize"></option>
                      </template>
                    </template>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-muted block mb-1">Priority</label>
                  <select x-model="kanbanDetailItem.priority" class="w-full bg-hover border border-base rounded-lg px-3 py-2 text-sm">
                    <option value="p0">P0 - Critical</option>
                    <option value="p1">P1 - High</option>
                    <option value="p2">P2 - Medium</option>
                    <option value="p3">P3 - Low</option>
                  </select>
                </div>
              </div>
              <div class="flex justify-end gap-3">
                <button @click="kanbanDetailOpen = false" class="px-4 py-2 text-sm text-muted hover:text-base transition-colors">Cancel</button>
                <button @click="saveKanbanDetail()" :disabled="kanbanSaving" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
                  <span x-show="!kanbanSaving">Save Changes</span>
                  <span x-show="kanbanSaving">Saving...</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- AI Tab -->
      <div x-show="tab === 'ai'">
        <h1 class="text-2xl font-bold mb-6">AI Assistant</h1>
        <div class="bg-card rounded-xl border border-base h-[calc(100vh-220px)] flex flex-col">
          <div class="flex-1 overflow-auto p-4 space-y-4" x-ref="chatMessages">
            <template x-if="chatMessages.length === 0">
              <div class="text-center py-12">
                <div class="text-4xl mb-4">🤖</div>
                <p class="text-muted">Ask me anything about your product!</p>
                <p class="text-muted text-sm mt-2">I have context about your epics, specs, and roadmap.</p>
              </div>
            </template>
            <template x-for="(msg, i) in chatMessages" :key="i">
              <div class="chat-msg" :class="msg.role === 'user' ? 'flex justify-end' : ''">
                <div :class="msg.role === 'user' ? 'bg-cyan-600 text-white max-w-[70%]' : 'bg-hover max-w-[85%]'" class="rounded-xl px-4 py-3">
                  <div x-html="msg.role === 'assistant' ? marked.parse(msg.content) : msg.content" class="prose prose-sm"></div>
                </div>
              </div>
            </template>
            <div x-show="streaming" class="chat-msg"><div class="bg-hover rounded-xl px-4 py-3 max-w-[85%]"><div x-html="marked.parse(streamingContent || '...')" class="prose prose-sm"></div></div></div>
          </div>
          <div class="p-4 border-t border-base">
            <form @submit.prevent="sendMessage()" class="flex gap-3">
              <input x-model="chatInput" type="text" placeholder="Ask about your product..." class="flex-1 bg-hover border border-base rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 transition-all" :disabled="streaming" />
              <button type="submit" :disabled="streaming || !chatInput.trim()" class="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 px-6 py-3 rounded-xl font-medium transition-all">Send</button>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    function dashboard() {
      return {
        tab: 'dashboard',
        theme: localStorage.getItem('theme') || 'dark',
        specs: [],
        editingSpec: null,
        editorContent: '',
        previewHTML: '',
        saving: false,
        saved: false,
        gitStatus: ${JSON.stringify(gitStatus)},
        fileTree: [],
        selectedFile: null,
        fileContent: '',
        chatMessages: [],
        chatInput: '',
        streaming: false,
        streamingContent: '',

        // Journeys state
        journeys: [],
        viewingJourney: null,
        journeySaving: false,
        journeySaved: false,

        // Kanban state
        kanbanView: 'epics',
        kanbanEpics: [],
        kanbanIssues: [],
        kanbanFilters: { priority: '', milestone: '' },
        kanbanMilestones: [],
        kanbanDetailOpen: false,
        kanbanDetailItem: null,
        kanbanSaving: false,
        sortableInstances: [],

        init() {
          document.documentElement.setAttribute('data-theme', this.theme);
          this.refreshGitStatus();
          setInterval(() => this.refreshGitStatus(), 10000);
        },

        toggleTheme() {
          this.theme = this.theme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('theme', this.theme);
          document.documentElement.setAttribute('data-theme', this.theme);
        },

        async loadSpecs() { this.specs = await fetch('/api/specs').then(r => r.json()); },
        async loadFiles() { this.fileTree = await fetch('/api/files').then(r => r.json()); },
        async loadJourneys() { this.journeys = await fetch('/api/journeys').then(r => r.json()); },
        async refreshGitStatus() { try { this.gitStatus = await fetch('/api/git/status').then(r => r.json()); } catch {} },

        async viewFile(path) {
          this.selectedFile = path;
          const res = await fetch('/api/files/' + path);
          const data = await res.json();
          this.fileContent = data.content || '';
        },

        openEditor(spec) { this.editingSpec = spec; this.editorContent = spec.content || ''; this.updatePreview(); this.saved = false; },
        closeEditor() { this.editingSpec = null; this.editorContent = ''; this.previewHTML = ''; },
        updatePreview() { this.previewHTML = marked.parse(this.editorContent || ''); },

        async saveSpec() {
          if (!this.editingSpec) return;
          this.saving = true; this.saved = false;
          try {
            const res = await fetch('/api/specs/' + this.editingSpec.id, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...this.editingSpec, content: this.editorContent })
            });
            if (res.ok) { const data = await res.json(); this.editingSpec = data.spec; this.saved = true; this.refreshGitStatus(); setTimeout(() => this.saved = false, 3000); }
          } catch (e) { console.error('Save failed:', e); }
          this.saving = false;
        },

        async sendMessage() {
          if (!this.chatInput.trim() || this.streaming) return;
          const userMsg = this.chatInput.trim();
          this.chatMessages.push({ role: 'user', content: userMsg });
          this.chatInput = ''; this.streaming = true; this.streamingContent = '';
          this.$nextTick(() => { this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight; });
          try {
            const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg }) });
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              for (const line of decoder.decode(value).split('\\n').filter(l => l.startsWith('data: '))) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) { this.streamingContent += data.content; this.$nextTick(() => { this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight; }); }
                  if (data.done) { this.chatMessages.push({ role: 'assistant', content: this.streamingContent }); this.streamingContent = ''; this.streaming = false; }
                  if (data.error) { this.chatMessages.push({ role: 'assistant', content: '❌ Error: ' + data.error }); this.streaming = false; }
                } catch {}
              }
            }
          } catch (e) { this.chatMessages.push({ role: 'assistant', content: '❌ Connection error. Configure AI with "prodman config set"' }); this.streaming = false; }
        },

        getSpecStatusClass(status) {
          return { draft: 'bg-gray-700 text-gray-300', review: 'bg-yellow-900/50 text-yellow-300', approved: 'bg-blue-900/50 text-blue-300', implemented: 'bg-emerald-900/50 text-emerald-300' }[status] || 'bg-gray-700 text-gray-300';
        },

        // Journey methods
        openJourneyView(journey) { this.viewingJourney = { ...journey }; this.journeySaved = false; },
        closeJourneyView() { this.viewingJourney = null; },

        getJourneyStatusClass(status) {
          return { draft: 'bg-blue-900/50 text-blue-300', validated: 'bg-yellow-900/50 text-yellow-300', implemented: 'bg-emerald-900/50 text-emerald-300', deprecated: 'bg-gray-700 text-gray-300' }[status] || 'bg-gray-700 text-gray-300';
        },

        getEmotionClass(emotion) {
          return { frustrated: 'text-red-400', confused: 'text-yellow-400', neutral: 'text-gray-400', satisfied: 'text-green-400', delighted: 'text-purple-400' }[emotion] || 'text-gray-400';
        },

        async saveJourney() {
          if (!this.viewingJourney) return;
          this.journeySaving = true; this.journeySaved = false;
          try {
            const res = await fetch('/api/journeys/' + this.viewingJourney.id, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.viewingJourney)
            });
            if (res.ok) { const data = await res.json(); this.viewingJourney = data.journey; this.journeySaved = true; this.loadJourneys(); this.refreshGitStatus(); setTimeout(() => this.journeySaved = false, 3000); }
          } catch (e) { console.error('Save failed:', e); }
          this.journeySaving = false;
        },

        // Kanban methods
        async loadKanban() {
          if (this.kanbanView === 'epics') {
            this.kanbanEpics = await fetch('/api/epics').then(r => r.json());
            this.kanbanMilestones = [...new Set(this.kanbanEpics.map(e => e.milestone).filter(Boolean))];
          } else {
            this.kanbanIssues = await fetch('/api/issues').then(r => r.json());
            const epics = await fetch('/api/epics').then(r => r.json());
            this.kanbanMilestones = [...new Set(epics.map(e => e.milestone).filter(Boolean))];
          }
          this.$nextTick(() => this.initKanbanDragDrop());
        },

        getFilteredKanbanItems(status) {
          const items = this.kanbanView === 'epics' ? this.kanbanEpics : this.kanbanIssues;
          return items.filter(item => {
            const statusMatch = item.status === status;
            const priorityMatch = !this.kanbanFilters.priority || item.priority === this.kanbanFilters.priority;
            let milestoneMatch = true;
            if (this.kanbanFilters.milestone) {
              if (this.kanbanView === 'epics') {
                milestoneMatch = item.milestone === this.kanbanFilters.milestone;
              } else {
                const epic = this.kanbanEpics.find(e => e.id === item.epic);
                milestoneMatch = epic?.milestone === this.kanbanFilters.milestone;
              }
            }
            return statusMatch && priorityMatch && milestoneMatch;
          });
        },

        getPriorityBadgeClass(priority) {
          const classes = { p0: 'bg-red-900/50 text-red-300', p1: 'bg-orange-900/50 text-orange-300', p2: 'bg-yellow-900/50 text-yellow-300', p3: 'bg-blue-900/50 text-blue-300' };
          return classes[priority] || 'bg-gray-700 text-gray-300';
        },

        initKanbanDragDrop() {
          this.sortableInstances.forEach(instance => instance?.destroy());
          this.sortableInstances = [];
          const statuses = this.kanbanView === 'epics' ? ['planned', 'planning', 'in_progress', 'complete', 'cancelled'] : ['open', 'in_progress', 'resolved', 'closed'];
          statuses.forEach(status => {
            const columnEl = document.querySelector('[data-status="' + status + '"]');
            if (!columnEl) return;
            const sortable = Sortable.create(columnEl, {
              group: 'kanban',
              animation: 150,
              ghostClass: 'sortable-ghost',
              onEnd: async (evt) => {
                const itemId = evt.item.getAttribute('data-id');
                const newStatus = evt.to.getAttribute('data-status');
                await this.updateKanbanItemStatus(itemId, newStatus);
              }
            });
            this.sortableInstances.push(sortable);
          });
        },

        async updateKanbanItemStatus(itemId, newStatus) {
          try {
            const endpoint = this.kanbanView === 'epics' ? '/api/epics/' : '/api/issues/';
            const res = await fetch(endpoint + itemId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
              const items = this.kanbanView === 'epics' ? this.kanbanEpics : this.kanbanIssues;
              const item = items.find(i => i.id === itemId);
              if (item) { item.status = newStatus; item.updated_at = new Date().toISOString().split('T')[0]; }
              this.refreshGitStatus();
            }
          } catch (e) { console.error('Failed to update status:', e); await this.loadKanban(); }
        },

        openKanbanDetail(item) {
          this.kanbanDetailItem = { ...item };
          this.kanbanDetailOpen = true;
        },

        async saveKanbanDetail() {
          if (!this.kanbanDetailItem) return;
          this.kanbanSaving = true;
          try {
            const endpoint = this.kanbanView === 'epics' ? '/api/epics/' : '/api/issues/';
            const res = await fetch(endpoint + this.kanbanDetailItem.id, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.kanbanDetailItem)
            });
            if (res.ok) {
              const data = await res.json();
              const updated = this.kanbanView === 'epics' ? data.epic : data.issue;
              const items = this.kanbanView === 'epics' ? this.kanbanEpics : this.kanbanIssues;
              const index = items.findIndex(i => i.id === updated.id);
              if (index !== -1) { items[index] = updated; }
              this.kanbanDetailOpen = false;
              this.kanbanDetailItem = null;
              this.refreshGitStatus();
              this.$nextTick(() => this.initKanbanDragDrop());
            }
          } catch (e) { console.error('Save failed:', e); }
          this.kanbanSaving = false;
        }
      }
    }
  </script>
</body>
</html>`;
}

function getStatusClass(status: string): string {
  switch (status) {
    case "planning": case "planned": return "bg-gray-700 text-gray-300";
    case "in_progress": return "bg-yellow-900/50 text-yellow-300";
    case "complete": return "bg-emerald-900/50 text-emerald-300";
    case "cancelled": return "bg-red-900/50 text-red-300";
    default: return "bg-gray-700 text-gray-300";
  }
}
