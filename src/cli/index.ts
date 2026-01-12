#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { initCommand } from "./commands/init.js";
import { uiCommand } from "./commands/ui.js";
import { epicCommand } from "./commands/epic.js";
import { specCommand } from "./commands/spec.js";
import { issueCommand } from "./commands/issue.js";
import { decisionCommand } from "./commands/decision.js";
import { syncCommand, pullCommand, resolveCommand, conflictsCommand } from "./commands/sync.js";
import { diffCommand } from "./commands/diff.js";
import { statusCommand } from "./commands/status.js";
import { searchCommand } from "./commands/search.js";
import { configCommand } from "./commands/config.js";
import { askCommand } from "./commands/ask.js";
import { VERSION } from "../core/constants.js";

const program = new Command();

program
  .name("prodman")
  .description(
    pc.bold("git-prodman") +
      " — Product management that lives in your Git repo.\n" +
      pc.dim("Local-first, AI-native, MIT licensed.")
  )
  .version(VERSION, "-v, --version", "Show version number");

// Initialize .prodman/ in current repo
program.addCommand(initCommand);

// Start web UI
program.addCommand(uiCommand);

// Epic management
program.addCommand(epicCommand);

// Spec management
program.addCommand(specCommand);

// Issue management
program.addCommand(issueCommand);

// Decision management
program.addCommand(decisionCommand);

// Git sync operations
program.addCommand(syncCommand);
program.addCommand(pullCommand);
program.addCommand(resolveCommand);
program.addCommand(conflictsCommand);

// Show uncommitted changes
program.addCommand(diffCommand);

// Show status
program.addCommand(statusCommand);

// Full-text search
program.addCommand(searchCommand);

// Configuration
program.addCommand(configCommand);

// Natural language query (default command for AI)
program.addCommand(askCommand);

// Handle unknown commands as AI queries
program.arguments("[query...]").action(async (queryParts: string[]) => {
  if (queryParts.length > 0) {
    const query = queryParts.join(" ");
    // Delegate to ask command
    const { handleAsk } = await import("./commands/ask.js");
    await handleAsk(query);
  } else {
    program.help();
  }
});

// Parse and execute
program.parse();
