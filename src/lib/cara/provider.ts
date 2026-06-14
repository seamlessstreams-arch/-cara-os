// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — PROVIDER ADAPTER
//
// JSON generation for the intelligence engine. Claude (Anthropic) is the only LLM
// provider; anything else falls back to stub/demo mode. OpenAI has been removed —
// Cara resolves rules → learned cache → Claude (last resort).
// Server-side only — never import in client components.
// ══════════════════════════════════════════════════════════════════════════════

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateJsonInput = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
};

/**
 * Generate a JSON response from the configured AI provider.
 * Falls back to stub mode if no provider is configured.
 */
export async function generateCaraJson(input: GenerateJsonInput): Promise<unknown> {
  const provider = (process.env.AI_PROVIDER ?? "stub").toLowerCase();

  if (provider === "anthropic") {
    return generateViaAnthropic(input);
  }

  // Stub mode — return a safe demo response (also the fallback for any non-Anthropic value)
  return generateStub(input);
}

async function generateViaAnthropic(input: GenerateJsonInput): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("placeholder")) {
    throw new Error("ANTHROPIC_API_KEY is missing or set to placeholder.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { default: Anthropic } = await import("@anthropic-ai/sdk" as string) as { default: new (opts: { apiKey: string }) => any };
  const client = new Anthropic({ apiKey });

  // Extract system message and user messages
  const systemMessage = input.messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = input.messages.filter((m) => m.role !== "system");

  const response = await client.messages.create({
    model: input.model ?? (process.env.CARA_MODEL ?? process.env.CARA_MODEL) ?? "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: input.temperature ?? 0.2,
    system: systemMessage + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation, just JSON.",
    messages: userMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  });

  const raw = response.content?.[0]?.type === "text" ? response.content[0].text : "";
  if (!raw) throw new Error("AI provider returned an empty response.");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI provider returned invalid JSON.");
  }
}

function generateStub(_input: GenerateJsonInput): unknown {
  return {
    answer: "Cara is running in demo mode. Configure AI_PROVIDER in your environment to enable live intelligence. This stub response ensures the system works end-to-end without an API key.",
    executiveSummary: "Demo mode — no AI provider configured.",
    childVoiceProtected: true,
    confidence: 25,
    safetyFlags: [],
    evidenceUsed: [],
    suggestedUpdates: [],
    missingEvidence: ["AI provider not configured — no evidence analysis performed."],
    managementOversightRequired: false,
    regulatoryRefs: [],
    qualityStandardRefs: [],
    practicePrompts: ["Configure AI_PROVIDER=anthropic to enable live Cara intelligence."],
    nextBestActions: [
      {
        title: "Configure AI provider",
        ownerRole: "System Administrator",
        duePriority: "this_week",
        rationale: "Cara intelligence requires a configured AI provider to analyse evidence and generate insights.",
      },
    ],
  };
}
