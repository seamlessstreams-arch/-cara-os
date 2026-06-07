// Claude Agent SDK agent that drives the Cornerstone care-platform API.
//
// Run:   set ANTHROPIC_API_KEY in .env, then `npm run agent -- "your prompt"`
// Reads are on by default; writes require CORNERSTONE_ALLOW_WRITES=true.
import "dotenv/config";
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { McpServerConfig } from "@anthropic-ai/claude-agent-sdk";
import { cornerstoneTools } from "./cornerstone-tools.ts";

async function main(): Promise<void> {
  const prompt =
    process.argv.slice(2).join(" ").trim() ||
    "Using cornerstone_get, list care events from the last 7 days and summarise anything that needs manager attention.";

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY. Copy .env.example to .env and set your key.");
    process.exit(1);
  }

  const mcpServers: Record<string, McpServerConfig> = {
    cornerstone: createSdkMcpServer({ name: "cornerstone", version: "0.1.0", tools: cornerstoneTools }),
  };

  for await (const msg of query({
    prompt,
    options: {
      model: process.env.AGENT_MODEL ?? "claude-sonnet-4-20250514",
      mcpServers,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      systemPrompt:
        "You are an operations assistant for the Cornerstone children's-home care platform. " +
        "Prefer the typed tools (list_young_people, get_young_person, list_care_events, home_intelligence, " +
        "child_health_intelligence, recruitment_overview); fall back to cornerstone_get for other paths. " +
        "Answer precisely from the returned data — never fabricate care information. " +
        "Use cornerstone_write only when explicitly asked (it is disabled unless writes are enabled).",
    },
  })) {
    if (msg.type === "assistant") {
      for (const block of msg.message.content) {
        if (block.type === "text") process.stdout.write(block.text);
      }
    } else if (msg.type === "result") {
      console.log(`\n\n[done: ${msg.subtype}]`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
