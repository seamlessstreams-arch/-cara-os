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
  {
    // Every rule above is Anthropic-specific, so a call to any OTHER provider
    // left the system unremarked — and four are implemented here (Cohere,
    // Mistral, Perplexity, Voyage). The provider files themselves are the
    // implementations and are expected to reach their own endpoint; what this
    // catches is anything ELSE calling out to one directly.
    label: "raw call to a non-Anthropic AI provider endpoint",
    pattern: /https:\/\/api\.(cohere\.com|mistral\.ai|voyageai\.com|perplexity\.ai|openai\.com)/,
    allowed: [
      "src/lib/cara/providers/cohere-provider.ts",
      "src/lib/cara/providers/mistral-provider.ts",
      "src/lib/cara/providers/perplexity-provider.ts",
      "src/lib/cara/providers/voyage-provider.ts",
    ],
  },
  {
    // The one caller that reaches a non-Anthropic provider outside the
    // gateway. It is deliberate and documented: Voyage is not on the approved
    // provider register, and BOTH call sites run redactSensitiveData first, so
    // no child-identifying text leaves the system. Listed by name so the next
    // such caller has to be considered rather than inherited.
    label: "provider call outside the AI gateway",
    pattern: /getProvider\(\s*["'](?!anthropic|claude)/,
    allowed: ["src/lib/cara/evidence/evidence-engine.ts"],
  },
  {
    // The Vercel AI SDK. Its generateText/streamText resolve a provider+model
    // from gateway env and reach a model with NONE of Cara's controls — no
    // sensitivity classification, no redaction, no provider risk register, no
    // injection guard, no response scanner, no audit. The oversight-intelligence
    // bypass (decision D5) was exactly this: `import { generateText } from "ai"`.
    // Nothing in Cara may import the "ai" package — all generation goes through
    // invokeAiGateway, whose provider seam uses the Anthropic SDK / raw fetch.
    label: 'Vercel AI SDK import ("ai") — bypasses the governed gateway',
    pattern: /from\s+["']ai["']/,
    allowed: [],
  },
  {
    // Google Generative Language (Gemini) REST endpoint. The legacy Cara Studio
    // provider stack can reach it directly — ungoverned — when GEMINI_API_KEY is
    // set (dormant on live, which runs Anthropic). It is not on the approved
    // provider register and does not pass through invokeAiGateway. Named here so
    // the egress is VISIBLE and no NEW Gemini caller is inherited silently;
    // routing Cara Studio through the governed gateway is tracked as decision D1
    // (studio consolidation), not bundled into this security fix.
    label: "raw call to the Google Gemini (Generative Language) endpoint",
    pattern: /generativelanguage\.googleapis\.com/,
    allowed: ["src/lib/cara/cara-studio-provider.ts"],
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
