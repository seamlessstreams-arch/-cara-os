// ══════════════════════════════════════════════════════════════════════════════
// CARA OS — AI GATEWAY BYPASS GUARD
//
// Fails if any code sends content to an AI provider without going through the
// AI Gateway (src/lib/cara/ai-gateway/ai-gateway.ts) — the single chokepoint
// that redacts PII, classifies sensitivity, checks the provider risk register,
// guards against prompt injection, and scans responses before they're used.
//
// Only the gateway's own provider seam may make the underlying call:
//   - src/lib/cara/cara-provider.ts          (non-streaming: raw fetch to
//     api.anthropic.com/v1/messages)
//   - src/lib/cara/cara-provider-stream.ts   (streaming: Anthropic SDK
//     .messages.stream())
//   - src/lib/anthropic-client.ts            (the shared client constructor —
//     may be called to check whether a key is configured; must never have its
//     .messages.* methods called directly outside the two files above)
//
// Everything else must call invokeAiGateway / invokeAiGatewayStream instead.
//
// Run: npm run check:ai-gateway   (also enforced by the vitest suite)
// ══════════════════════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const root = process.cwd();

const SCAN_ROOTS = ["src"];

const ignoredDirs = new Set([".git", "node_modules", ".next", "dist", "build", "coverage", ".tmp", "__tests__"]);

// The only files allowed to make the underlying provider call.
const allowedProviderFiles = [
  "src/lib/cara/cara-provider.ts",
  "src/lib/cara/cara-provider-stream.ts",
  "src/lib/anthropic-client.ts",
];

// Each rule: a pattern that indicates content is being sent to (or requested
// from) an AI provider directly, and which file(s) are allowed to match it.
const rules = [
  {
    label: "Anthropic SDK .messages.create()/.messages.stream() call",
    pattern: /\.messages\.(create|stream)\s*\(/,
    allowed: ["src/lib/cara/cara-provider-stream.ts"],
  },
  {
    label: "raw fetch() to the Anthropic API",
    pattern: /fetch\([^)]*api\.anthropic\.com/,
    allowed: [
      "src/lib/cara/cara-provider.ts",
      // cara-health.ts pingAnthropic() sends a hardcoded "ping" literal
      // (max_tokens: 1) to check provider reachability — no user/record
      // content is ever sent, so there is nothing to redact or guard.
      "src/lib/cara/cara-health.ts",
    ],
  },
  {
    label: "direct Anthropic SDK client construction",
    pattern: /new Anthropic\s*\(/,
    allowed: ["src/lib/anthropic-client.ts"],
  },
];

const textExtensions = new Set([".ts", ".tsx"]);

const violations = [];

function scanFile(fullPath) {
  const relPath = path.relative(root, fullPath).split(path.sep).join("/");
  if (allowedProviderFiles.includes(relPath)) return;
  if (relPath.includes("/__tests__/") || relPath.endsWith(".test.ts") || relPath.endsWith(".test.tsx")) return;
  const ext = path.extname(fullPath).toLowerCase();
  if (!textExtensions.has(ext)) return;
  let content;
  try {
    content = fs.readFileSync(fullPath, "utf8");
  } catch {
    return;
  }
  const lines = content.split("\n");
  for (const rule of rules) {
    if (rule.allowed.includes(relPath)) continue;
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        violations.push(`${relPath}:${i + 1}: ${rule.label} → ${lines[i].trim().slice(0, 120)}`);
      }
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else scanFile(fullPath);
  }
}

for (const scanRoot of SCAN_ROOTS) {
  const fullPath = path.join(root, scanRoot);
  if (!fs.existsSync(fullPath)) continue;
  if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
  else scanFile(fullPath);
}

if (violations.length) {
  console.error("AI Gateway bypass detected — content would reach a provider without redaction, sensitivity checks, the injection guard, or the response scanner:");
  for (const v of violations) console.error(`- ${v}`);
  console.error("\nRoute this call through invokeAiGateway / invokeAiGatewayStream (src/lib/cara/ai-gateway) instead.");
  process.exit(1);
}

console.log("AI Gateway bypass check passed: no direct provider calls found outside the gateway's own provider seam.");
