// ══════════════════════════════════════════════════════════════════════════════
// Cara — PROVIDER ABSTRACTION
//
// Server-side only. Never imported into client code.
//
// Uses Claude (Anthropic) as the only LLM provider — OpenAI has been removed.
// The provider is read from ARIA_PROVIDER / AI_PROVIDER (defaults to "anthropic").
// The repo also has Anthropic-based engines
// (managementOversightEngine, voiceOfChildSummariser, hrProcessGuardian)
// that talk to Anthropic directly via the @anthropic-ai/sdk package. This
// abstraction is for the universal /api/aria/generate and /api/aria/transcribe
// routes.
//
// The provider is built lazily per request so process.env is read at runtime
// rather than at module-load time (Turbopack / Next.js 16 compatibility).
//
// Missing keys must not crash the app. Callers receive { configured: false }
// and surface a clear "Cara is not configured yet" message in the UI.
// ══════════════════════════════════════════════════════════════════════════════

export interface AriaProviderConfig {
  configured: boolean;
  providerId: "anthropic" | "none";
  textModel: string;
  transcribeModel: string;
  maxAudioBytes: number;
  reason?: string;
}

export function getAriaProviderConfig(): AriaProviderConfig {
  const providerEnv = ((process.env.CARA_PROVIDER ?? process.env.ARIA_PROVIDER) ?? process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  const transcribeModel = (process.env.CARA_TRANSCRIBE_MODEL ?? process.env.ARIA_TRANSCRIBE_MODEL) ?? "gpt-4o-transcribe";
  const maxAudioMb = Number.parseInt((process.env.CARA_MAX_AUDIO_MB ?? process.env.ARIA_MAX_AUDIO_MB) ?? "25", 10);
  const maxAudioBytes = Number.isFinite(maxAudioMb) ? maxAudioMb * 1024 * 1024 : 25 * 1024 * 1024;

  if (providerEnv === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const textModel = (process.env.CARA_MODEL ?? process.env.ARIA_MODEL) ?? (process.env.CARA_TEXT_MODEL ?? process.env.ARIA_TEXT_MODEL) ?? "claude-sonnet-4-20250514";

    if (!apiKey || apiKey.includes("placeholder")) {
      return {
        configured: false,
        providerId: "anthropic",
        textModel,
        transcribeModel,
        maxAudioBytes,
        reason: "ANTHROPIC_API_KEY is not set. Configure it server-side to enable the universal Cara layer.",
      };
    }

    return {
      configured: true,
      providerId: "anthropic",
      textModel,
      transcribeModel,
      maxAudioBytes,
    };
  }

  // Any other provider value is unsupported — OpenAI has been removed; Claude only.
  const textModel = (process.env.CARA_TEXT_MODEL ?? process.env.ARIA_TEXT_MODEL) ?? "claude-sonnet-4-20250514";
  return {
    configured: false,
    providerId: "none",
    textModel,
    transcribeModel,
    maxAudioBytes,
    reason: `Unsupported ARIA_PROVIDER / AI_PROVIDER value "${providerEnv}". The only supported provider is "anthropic" (Claude).`,
  };
}

// ─── Text generation ────────────────────────────────────────────────────────

export interface AriaTextGenerationInput {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  // For commands that ask the model for JSON, supply true so we instruct the
  // provider to return JSON. The caller still validates.
  expectJson?: boolean;
  // HQ cost metering label — which product feature made this call.
  feature?: string;
}

export interface AriaTextGenerationResult {
  text: string;
  llmUsed: boolean;
  providerId: AriaProviderConfig["providerId"];
  modelId: string;
}

export async function generateText(
  input: AriaTextGenerationInput,
): Promise<AriaTextGenerationResult> {
  const config = getAriaProviderConfig();
  if (!config.configured) {
    return {
      text: ariaNotConfiguredFallback(input.expectJson === true),
      llmUsed: false,
      providerId: "none",
      modelId: config.textModel,
    };
  }

  // ── Anthropic path ──────────────────────────────────────────────────────
  if (config.providerId === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY!;
    const url = "https://api.anthropic.com/v1/messages";
    const body = {
      model: config.textModel,
      max_tokens: input.maxOutputTokens ?? 1500,
      messages: [
        { role: "user" as const, content: input.userPrompt },
      ],
      system: input.systemPrompt,
      ...(input.temperature != null ? { temperature: input.temperature } : {}),
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Anthropic text generation failed (${res.status}): ${detail.slice(0, 400)}`);
      }
      const data = (await res.json()) as {
        content?: { type: string; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = data.content?.[0]?.text?.trim() ?? "";
      // HQ cost metering — best-effort, never blocks or fails the call.
      // Dynamic import keeps the server-only meter out of this module graph.
      void import("@/lib/hq/usage-meter")
        .then((m) =>
          m.recordAiUsage({
            feature: input.feature ?? "cara_text",
            model: config.textModel,
            tokensInput: data.usage?.input_tokens ?? 0,
            tokensOutput: data.usage?.output_tokens ?? Math.ceil(text.length / 4),
          }),
        )
        .catch(() => {});
      return {
        text,
        llmUsed: true,
        providerId: "anthropic",
        modelId: config.textModel,
      };
    } catch (err) {
      console.warn("[aria-provider] generateText (anthropic) failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        text: ariaProviderErrorFallback(errMsg, "anthropic", input.expectJson === true),
        llmUsed: false,
        providerId: "anthropic",
        modelId: config.textModel,
      };
    }
  }

  // Only "anthropic" and "none" are possible now (OpenAI removed), both handled above.
  // Defensive fallback should the provider config ever be in an unexpected state.
  return {
    text: ariaNotConfiguredFallback(input.expectJson === true),
    llmUsed: false,
    providerId: "none",
    modelId: config.textModel,
  };
}

// ─── Audio transcription ────────────────────────────────────────────────────

export interface AriaTranscriptionProviderInput {
  audio: Buffer | Uint8Array;
  fileName: string;
  mimeType: string;
}

export interface AriaTranscriptionProviderResult {
  transcript: string;
  llmUsed: boolean;
  providerId: AriaProviderConfig["providerId"];
  modelId: string;
}

export async function transcribeAudio(
  input: AriaTranscriptionProviderInput,
): Promise<AriaTranscriptionProviderResult> {
  const config = getAriaProviderConfig();
  if (!config.configured) {
    return {
      transcript: "",
      llmUsed: false,
      providerId: "none",
      modelId: config.transcribeModel,
    };
  }

  // Anthropic does not support audio transcription. Return empty transcript
  // without crashing so callers can handle gracefully.
  if (config.providerId === "anthropic") {
    return {
      transcript: "",
      llmUsed: false,
      providerId: "anthropic",
      modelId: config.transcribeModel,
    };
  }

  // Only "anthropic" and "none" are possible now (OpenAI removed) — both handled
  // above. Server-side transcription is unavailable; callers fall back to the
  // browser's built-in SpeechRecognition.
  return {
    transcript: "",
    llmUsed: false,
    providerId: "none",
    modelId: config.transcribeModel,
  };
}

// ─── Fallback when not configured ──────────────────────────────────────────

function ariaNotConfiguredFallback(expectJson: boolean): string {
  const message =
    "Cara is not configured in this environment. The provider key has not been set, so the universal Cara layer cannot generate text. Add ANTHROPIC_API_KEY to your server environment to enable it.";
  if (expectJson) {
    return JSON.stringify({ ariaNotConfigured: true, message });
  }
  return `Cara suggested draft. ${message}`;
}

function ariaProviderErrorFallback(errorDetail: string, provider: string, expectJson: boolean): string {
  // Parse common provider errors into admin-friendly messages
  let userMessage: string;
  const lower = errorDetail.toLowerCase();

  if (lower.includes("credit balance") || lower.includes("billing") || lower.includes("purchase credits")) {
    userMessage = `Cara's AI provider (${provider}) requires account credits to be topped up. Please visit your Anthropic dashboard to add credits, then Cara will work automatically.`;
  } else if (lower.includes("authentication") || lower.includes("401") || lower.includes("invalid.*key")) {
    userMessage = `Cara's API key for ${provider} is invalid or expired. Please update it in the server environment variables.`;
  } else if (lower.includes("rate limit") || lower.includes("429")) {
    userMessage = `Cara's AI provider (${provider}) is temporarily rate-limited. Please try again in a moment.`;
  } else if (lower.includes("503") || lower.includes("529") || lower.includes("overloaded") || lower.includes("unavailable")) {
    userMessage = `Cara's AI provider (${provider}) is temporarily unavailable. This usually resolves within minutes.`;
  } else if (lower.includes("timeout") || lower.includes("abort")) {
    userMessage = `Cara's AI provider (${provider}) took too long to respond. Please try again.`;
  } else {
    userMessage = `Cara encountered an issue connecting to ${provider}. The AI provider returned an error. Please check your configuration or try again later.`;
  }

  if (expectJson) {
    return JSON.stringify({ ariaError: true, message: userMessage, provider });
  }
  return `Cara notice: ${userMessage}`;
}
