// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — EXTENDED AI PROVIDER
// Supports: OpenAI, Anthropic, Gemini, Stub (safe fallback for dev/demo)
// All providers return AriaStudioProviderResult.
// The stub provider returns clearly-marked demo content only.
// ══════════════════════════════════════════════════════════════════════════════

import type { AriaArtifactType, AriaFramework, AriaTone, AriaCreativeMode } from "@/types/aria-studio";

export type AriaStudioProvider = "openai" | "anthropic" | "gemini" | "stub";

export interface AriaStudioProviderConfig {
  provider: AriaStudioProvider;
  model: string;
  configured: boolean;
  maxTokens: number;
  temperature: number;
}

export interface AriaStudioGenerationInput {
  artifactType: AriaArtifactType;
  title: string;
  framework: AriaFramework;
  tone: AriaTone;
  creativeMode: AriaCreativeMode;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface AriaStudioProviderResult {
  content: string;
  model: string;
  provider: AriaStudioProvider;
  inputTokens?: number;
  outputTokens?: number;
  isStub: boolean;
}

// ── Provider config detection ─────────────────────────────────────────────────

export function getAriaStudioProviderConfig(): AriaStudioProviderConfig {
  const explicit = process.env.AI_PROVIDER as AriaStudioProvider | undefined;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const enableStubFallback = process.env.AI_ENABLE_STUB_FALLBACK !== "false";
  // Fall back to the configured ARIA_MODEL (a real, valid Claude id) — NOT an invented
  // "claude-opus-4-5", which the API rejects and silently drops generation to the stub.
  const defaultModel = process.env.AI_DEFAULT_MODEL ?? process.env.ARIA_MODEL;

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
  if (explicit === "openai" && openaiKey) {
    return {
      provider: "openai",
      model: defaultModel ?? "gpt-4o",
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
  if (openaiKey) {
    return {
      provider: "openai",
      model: defaultModel ?? "gpt-4o",
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

export async function generateAriaStudioContent(
  input: AriaStudioGenerationInput,
  config?: AriaStudioProviderConfig
): Promise<AriaStudioProviderResult> {
  const cfg = config ?? getAriaStudioProviderConfig();

  if (!cfg.configured || cfg.provider === "stub") {
    return generateStubContent(input);
  }

  try {
    switch (cfg.provider) {
      case "anthropic":
        return await generateWithAnthropic(input, cfg);
      case "openai":
        return await generateWithOpenAI(input, cfg);
      case "gemini":
        return await generateWithGemini(input, cfg);
      default:
        return generateStubContent(input);
    }
  } catch (err) {
    // If generation fails, fall back to stub rather than crashing
    console.error("[ARIA Studio] Generation error — falling back to stub:", err);
    const stub = generateStubContent(input);
    stub.content = `> ⚠️ AI generation unavailable — showing demo content only.\n\n${stub.content}`;
    return stub;
  }
}

// ── Anthropic provider ────────────────────────────────────────────────────────

async function generateWithAnthropic(
  input: AriaStudioGenerationInput,
  config: AriaStudioProviderConfig
): Promise<AriaStudioProviderResult> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: config.model,
    max_tokens: input.maxTokens ?? config.maxTokens,
    system: input.systemPrompt,
    messages: [{ role: "user", content: input.userPrompt }],
  });

  const content = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  return {
    content,
    model: config.model,
    provider: "anthropic",
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    isStub: false,
  };
}

// ── OpenAI provider ───────────────────────────────────────────────────────────

async function generateWithOpenAI(
  input: AriaStudioGenerationInput,
  config: AriaStudioProviderConfig
): Promise<AriaStudioProviderResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { default: OpenAI } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "openai" as any);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: config.model,
    max_tokens: input.maxTokens ?? config.maxTokens,
    temperature: config.temperature,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";

  return {
    content,
    model: config.model,
    provider: "openai",
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
    isStub: false,
  };
}

// ── Gemini provider ───────────────────────────────────────────────────────────

async function generateWithGemini(
  input: AriaStudioGenerationInput,
  config: AriaStudioProviderConfig
): Promise<AriaStudioProviderResult> {
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

function generateStubContent(input: AriaStudioGenerationInput): AriaStudioProviderResult {
  const typeLabel = input.artifactType.replace(/_/g, " ");
  const frameworkLabel = input.framework === "none" ? "no specific framework" : input.framework.toUpperCase();

  const content = `## ${input.title}

> **ARIA STUDIO DEMO** — This is example content generated by the stub provider. It is not based on real records and must not be used as an official record.

### Purpose
This is a ${typeLabel} prepared using ${frameworkLabel} with a ${input.tone} tone.

### What ARIA would do here
When connected to a live AI provider (Anthropic Claude, OpenAI GPT-4o, or Google Gemini), ARIA would:

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
*ARIA-suggested actions for manager review and approval would appear here. No action is taken automatically.*

### How to enable live generation
Set one of the following environment variables:

\`\`\`
ANTHROPIC_API_KEY=...   # Recommended — Claude Opus/Sonnet
OPENAI_API_KEY=...      # Alternative — GPT-4o
GEMINI_API_KEY=...      # Alternative — Gemini 1.5 Pro
\`\`\`

Or set \`AI_PROVIDER=stub\` to keep demo mode intentionally.

---

**This is an ARIA-generated draft (demo). It requires human review and approval before any action is taken. ARIA drafts. Humans decide.**`;

  return {
    content,
    model: "stub",
    provider: "stub",
    isStub: true,
  };
}
