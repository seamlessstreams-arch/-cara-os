// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — EXTENDED AI PROVIDER
// Supports: Anthropic, Gemini, Stub (safe fallback for dev/demo)
// All providers return CaraStudioProviderResult.
// The stub provider returns clearly-marked demo content only.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraArtifactType, CaraFramework, CaraTone, CaraCreativeMode } from "@/types/cara-studio";

export type CaraStudioProvider = "anthropic" | "gemini" | "stub";

export interface CaraStudioProviderConfig {
  provider: CaraStudioProvider;
  model: string;
  configured: boolean;
  maxTokens: number;
  temperature: number;
}

export interface CaraStudioGenerationInput {
  artifactType: CaraArtifactType;
  title: string;
  framework: CaraFramework;
  tone: CaraTone;
  creativeMode: CaraCreativeMode;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface CaraStudioProviderResult {
  content: string;
  model: string;
  provider: CaraStudioProvider;
  inputTokens?: number;
  outputTokens?: number;
  isStub: boolean;
}

// ── Provider config detection ─────────────────────────────────────────────────

export function getCaraStudioProviderConfig(): CaraStudioProviderConfig {
  const explicit = process.env.AI_PROVIDER as CaraStudioProvider | undefined;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const enableStubFallback = process.env.AI_ENABLE_STUB_FALLBACK !== "false";
  // Fall back to the configured CARA_MODEL (a real, valid Claude id) — NOT an invented
  // "claude-opus-4-5", which the API rejects and silently drops generation to the stub.
  const defaultModel = process.env.AI_DEFAULT_MODEL ?? (process.env.CARA_MODEL ?? process.env.CARA_MODEL);

  // If provider explicitly set, honour that
  if (explicit === "anthropic" && anthropicKey) {
    return {
      provider: "anthropic",
      model: defaultModel ?? "claude-sonnet-4-20250514",
      configured: true,
      maxTokens: 4096,
      temperature: 0.4,
    };
  }
  if (explicit === "gemini" && geminiKey) {
    return {
      provider: "gemini",
      model: defaultModel ?? "gemini-1.5-pro",
      configured: true,
      maxTokens: 4096,
      temperature: 0.4,
    };
  }
  if (explicit === "stub") {
    return { provider: "stub", model: "stub", configured: true, maxTokens: 4096, temperature: 0 };
  }

  // Auto-detect from available keys
  if (anthropicKey) {
    return {
      provider: "anthropic",
      model: defaultModel ?? "claude-sonnet-4-20250514",
      configured: true,
      maxTokens: 4096,
      temperature: 0.4,
    };
  }
  if (geminiKey) {
    return {
      provider: "gemini",
      model: defaultModel ?? "gemini-1.5-pro",
      configured: true,
      maxTokens: 4096,
      temperature: 0.4,
    };
  }

  // Safe fallback
  if (enableStubFallback) {
    return { provider: "stub", model: "stub", configured: true, maxTokens: 4096, temperature: 0 };
  }

  return { provider: "stub", model: "none", configured: false, maxTokens: 0, temperature: 0 };
}

// ── Generation dispatcher ─────────────────────────────────────────────────────

export async function generateCaraStudioContent(
  input: CaraStudioGenerationInput,
  config?: CaraStudioProviderConfig
): Promise<CaraStudioProviderResult> {
  const cfg = config ?? getCaraStudioProviderConfig();

  if (!cfg.configured || cfg.provider === "stub") {
    return generateStubContent(input);
  }

  try {
    switch (cfg.provider) {
      case "anthropic":
        return await generateWithAnthropic(input, cfg);
      case "gemini":
        return await generateWithGemini(input, cfg);
      default:
        return generateStubContent(input);
    }
  } catch (err) {
    // If generation fails, fall back to stub rather than crashing
    console.error("[Cara Studio] Generation error — falling back to stub:", err);
    const stub = generateStubContent(input);
    stub.content = `> ⚠️ AI generation unavailable — showing demo content only.\n\n${stub.content}`;
    return stub;
  }
}

// ── Anthropic provider ────────────────────────────────────────────────────────

async function generateWithAnthropic(
  input: CaraStudioGenerationInput,
  config: CaraStudioProviderConfig
): Promise<CaraStudioProviderResult> {
  // Through the AI Gateway — metering, cost limits, redaction, audit. A no-key /
  // refused gateway throws so the dispatcher's catch falls back to demo content,
  // matching the previous "generation unavailable → stub" behaviour.
  const { invokeAiGateway } = await import("@/lib/cara/ai-gateway");
  const gw = await invokeAiGateway({
    purpose: "cara_studio_content",
    feature: "cara_studio",
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    maxOutputTokens: input.maxTokens ?? config.maxTokens,
  });
  if (!gw.llmUsed || !gw.output) throw new Error("AI Gateway returned no content (no key or refused).");

  return {
    content: gw.output,
    model: gw.model ?? config.model,
    provider: "anthropic",
    inputTokens: gw.tokensInput ?? Math.ceil((input.systemPrompt.length + input.userPrompt.length) / 4),
    outputTokens: gw.tokensOutput ?? Math.ceil(gw.output.length / 4),
    isStub: false,
  };
}

// ── Gemini provider ───────────────────────────────────────────────────────────

async function generateWithGemini(
  input: CaraStudioGenerationInput,
  config: CaraStudioProviderConfig
): Promise<CaraStudioProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: `${input.systemPrompt}\n\n${input.userPrompt}` },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: input.maxTokens ?? config.maxTokens,
      temperature: config.temperature,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  return {
    content,
    model: config.model,
    provider: "gemini",
    isStub: false,
  };
}

// ── Stub provider ─────────────────────────────────────────────────────────────
// Returns clearly-marked demo content. Safe to use in all environments.

function generateStubContent(input: CaraStudioGenerationInput): CaraStudioProviderResult {
  const typeLabel = input.artifactType.replace(/_/g, " ");
  const frameworkLabel = input.framework === "none" ? "no specific framework" : input.framework.toUpperCase();

  const content = `## ${input.title}

> **Cara STUDIO DEMO** — This is example content generated by the stub provider. It is not based on real records and must not be used as an official record.

### Purpose
This is a ${typeLabel} prepared using ${frameworkLabel} with a ${input.tone} tone.

### What Cara would do here
When connected to a live AI provider (Anthropic Claude or Google Gemini), Cara would:

1. **Gather verified evidence** from the child's record, daily logs, incidents, keywork sessions and care plans
2. **Analyse patterns** across the evidence using ${frameworkLabel}
3. **Draft structured content** with clearly marked sections
4. **Identify gaps** in recording or evidence
5. **Flag safeguarding considerations** if present
6. **Suggest actions** for manager review

### Demo sections

#### Section 1: Evidence summary
*Evidence from the past 30 days would appear here, drawn from verified daily logs, incident records and care plans.*

#### Section 2: Analysis
*A structured analysis using ${frameworkLabel} would appear here, highlighting themes, patterns and areas of strength and concern.*

#### Section 3: Child voice
*Evidence of the child's own voice — their words, preferences, and expressed needs — would appear here.*

#### Section 4: Suggested actions
*Cara-suggested actions for manager review and approval would appear here. No action is taken automatically.*

### How to enable live generation
Set one of the following environment variables:

\`\`\`
ANTHROPIC_API_KEY=...   # Recommended — Claude Opus/Sonnet
GEMINI_API_KEY=...      # Alternative — Gemini 1.5 Pro
\`\`\`

Or set \`AI_PROVIDER=stub\` to keep demo mode intentionally.

---

**This is an Cara-generated draft (demo). It requires human review and approval before any action is taken. Cara drafts. Humans decide.**`;

  return {
    content,
    model: "stub",
    provider: "stub",
    isStub: true,
  };
}
