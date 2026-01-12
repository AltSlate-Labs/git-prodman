import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import MiniSearch from "minisearch";
import { findProdmanRoot, readEpics, readSpecs, getProdmanPath } from "../../core/fs.js";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { PRODMAN_DIRS } from "../../core/constants.js";

interface SearchDocument {
  id: string;
  type: "epic" | "spec" | "decision";
  title: string;
  content: string;
}

export const searchCommand = new Command("search")
  .description("Search across all product artifacts")
  .argument("<query>", "Search query")
  .option("-t, --type <type>", "Filter by type: epic, spec, decision")
  .option("--json", "Output as JSON")
  .action(async (query: string, options) => {
    const root = findProdmanRoot();
    if (!root) {
      p.log.error(pc.red("Not in a git-prodman project."));
      process.exit(1);
    }

    // Build search index
    const documents: SearchDocument[] = [];

    // Index epics
    const epics = readEpics(root);
    for (const epic of epics) {
      documents.push({
        id: epic.id,
        type: "epic",
        title: epic.title,
        content: [
          epic.description || "",
          ...epic.acceptance_criteria,
          ...epic.labels,
        ].join(" "),
      });
    }

    // Index specs
    const specs = readSpecs(root);
    for (const spec of specs) {
      documents.push({
        id: spec.id,
        type: "spec",
        title: spec.title,
        content: spec.content,
      });
    }

    // Index decisions
    const decisionsDir = getProdmanPath(root, PRODMAN_DIRS.decisions);
    if (existsSync(decisionsDir)) {
      const decisionFiles = readdirSync(decisionsDir).filter((f) =>
        f.endsWith(".md")
      );
      for (const file of decisionFiles) {
        const content = readFileSync(join(decisionsDir, file), "utf-8");
        const id = file.replace(".md", "").toUpperCase();
        documents.push({
          id,
          type: "decision",
          title: file.replace(".md", ""),
          content,
        });
      }
    }

    if (documents.length === 0) {
      p.log.info(pc.dim("No documents to search."));
      return;
    }

    // Create search index
    const miniSearch = new MiniSearch<SearchDocument>({
      fields: ["title", "content"],
      storeFields: ["id", "type", "title"],
    });

    miniSearch.addAll(documents);

    // Search
    let results = miniSearch.search(query, { prefix: true, fuzzy: 0.2 });

    // Filter by type if specified
    if (options.type) {
      results = results.filter((r) => r.type === options.type);
    }

    if (results.length === 0) {
      p.log.info(pc.dim(`No results found for "${query}"`));
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    console.log();
    console.log(pc.bold(`Search results for "${pc.cyan(query)}"`));
    console.log(pc.dim("─".repeat(50)));
    console.log();

    for (const result of results.slice(0, 20)) {
      const typeIcon = getTypeIcon(result.type);
      const typeColor = getTypeColor(result.type);
      console.log(
        `${typeIcon} ${typeColor(result.type.toUpperCase().padEnd(10))} ${pc.cyan(result.id.padEnd(12))} ${result.title}`
      );
    }

    if (results.length > 20) {
      console.log();
      console.log(pc.dim(`... and ${results.length - 20} more results`));
    }

    console.log();
  });

function getTypeIcon(type: string): string {
  switch (type) {
    case "epic":
      return "🎯";
    case "spec":
      return "📝";
    case "decision":
      return "⚖️";
    default:
      return "📄";
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "epic":
      return pc.yellow;
    case "spec":
      return pc.blue;
    case "decision":
      return pc.magenta;
    default:
      return pc.white;
  }
}
