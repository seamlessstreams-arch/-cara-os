// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — PROVIDER ADAPTER
//
// JSON generation for the intelligence engine. Claude (Anthropic) is the only LLM
// provider; anything else falls back to stub/demo mode.
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
  // Collapse the chat messages into the gateway's system + single-user-prompt shape.
  const systemMessage = input.messages.find((m) => m.role === "system")?.content ?? "";
  const userPrompt = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => (m.role === "assistant" ? `[assistant]\n${m.content}` : m.content))
    .join("\n\n");

  // Through the AI Gateway: the whole intelligence engine (all 11 agents call this
  // seam) now inherits redaction, cost limits, metering, and audit. Default
  // redaction applies — analysis runs on de-identified records, the privacy posture
  // the rebuild calls for. The JSON contract and the throw-on-no-AI behaviour are
  // preserved so callers degrade exactly as before.
  const { invokeAiGateway } = await import("@/lib/cara/ai-gateway");
  const gw = await invokeAiGateway({
    purpose: "intelligence_json",
    feature: "cara_intelligence",
    systemPrompt: systemMessage + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation, just JSON.",
    userPrompt,
    temperature: input.temperature ?? 0.2,
    maxOutputTokens: 4096,
    expectJson: true,
  });
  if (!gw.llmUsed) throw new Error("AI provider is not available (no key or refused by the gateway).");

  const raw = gw.output;
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
