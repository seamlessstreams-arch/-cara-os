// ══════════════════════════════════════════════════════════════════════════════
// ARIA — PROVIDER ABSTRACTION
//
// Server-side only. Never imported into client code.
//
// Default provider: OpenAI. The repo also has Anthropic-based engines
// (managementOversightEngine, voiceOfChildSummariser, hrProcessGuardian)
// that talk to Anthropic directly via the @anthropic-ai/sdk package. This
// abstraction is for the universal /api/aria/generate and /api/aria/transcribe
// routes, where OpenAI is the default per the spec.
//
// The provider is built lazily per request so process.env is read at runtime
// rather than at module-load time (Turbopack / Next.js 16 compatibility).
//
// Missing keys must not crash the app. Callers receive { configured: false }
// and surface a clear "Aria is not configured yet" message in the UI.
// ══════════════════════════════════════════════════════════════════════════════

export interface AriaProviderConfig {
  configured: boolean;
  providerId: "openai" | "none";
  textModel: string;
  transcribeModel: string;
  maxAudioBytes: number;
  reason?: string;
}

export function getAriaProviderConfig(): AriaProviderConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  const providerEnv = (process.env.ARIA_PROVIDER ?? "openai").toLowerCase();
  const textModel = process.env.ARIA_TEXT_MODEL ?? "gpt-4.1-mini";
  const transcribeModel = process.env.ARIA_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe";
  const maxAudioMb = Number.parseInt(process.env.ARIA_MAX_AUDIO_MB ?? "25", 10);
  const maxAudioBytes = Number.isFinite(maxAudioMb) ? maxAudioMb * 1024 * 1024 : 25 * 1024 * 1024;

  if (providerEnv !== "openai") {
    return {
      configured: false,
      providerId: "none",
      textModel,
      transcribeModel,
      maxAudioBytes,
      reason: `Unsupported ARIA_PROVIDER value "${providerEnv}". Only "openai" is supported by the universal layer in this build.`,
    };
  }

  if (!apiKey || apiKey.includes("placeholder")) {
    return {
      configured: false,
      providerId: "openai",
      textModel,
      transcribeModel,
      maxAudioBytes,
      reason: "OPENAI_API_KEY is not set. Configure it server-side to enable the universal Aria layer.",
    };
  }

  return {
    configured: true,
    providerId: "openai",
    textModel,
    transcribeModel,
    maxAudioBytes,
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
  if (!config.configured || config.providerId !== "openai") {
    return {
      text: ariaNotConfiguredFallback(input.expectJson === true),
      llmUsed: false,
      providerId: "none",
      modelId: config.textModel,
    };
  }

  // Lazy import: OpenAI is loaded only when actually called, and only on
  // the server. Falling back to fetch keeps the dependency surface light if
  // the openai package isn't already in the project.
  const apiKey = process.env.OPENAI_API_KEY!;
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: config.textModel,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt },
    ],
    temperature: input.temperature ?? 0.4,
    max_tokens: input.maxOutputTokens ?? 1500,
    ...(input.expectJson ? { response_format: { type: "json_object" } } : {}),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenAI text generation failed (${res.status}): ${detail.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      text,
      llmUsed: true,
      providerId: "openai",
      modelId: config.textModel,
    };
  } catch (err) {
    console.warn("[aria-provider] generateText failed:", err);
    return {
      text: ariaNotConfiguredFallback(input.expectJson === true),
      llmUsed: false,
      providerId: "openai",
      modelId: config.textModel,
    };
  }
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
  if (!config.configured || config.providerId !== "openai") {
    return {
      transcript: "",
      llmUsed: false,
      providerId: "none",
      modelId: config.transcribeModel,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY!;
  const url = "https://api.openai.com/v1/audio/transcriptions";

  // Build the multipart form using global FormData / Blob (Node 18+, Next.js
  // route handlers run on the Edge or Node runtime depending on config; both
  // expose FormData and Blob).
  const form = new FormData();
  // Coerce to a plain ArrayBuffer to satisfy strict BlobPart typing across
  // Node 18+/Edge runtimes where Uint8Array<ArrayBufferLike> is the default.
  const audio = input.audio;
  const ab: ArrayBuffer =
    audio instanceof Buffer
      ? audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer
      : (audio.buffer as ArrayBuffer).slice(audio.byteOffset, audio.byteOffset + audio.byteLength);
  const blob = new Blob([ab], { type: input.mimeType });
  form.append("file", blob, input.fileName);
  form.append("model", config.transcribeModel);
  form.append("response_format", "json");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenAI transcription failed (${res.status}): ${detail.slice(0, 400)}`);
    }
    const data = (await res.json()) as { text?: string };
    return {
      transcript: data.text?.trim() ?? "",
      llmUsed: true,
      providerId: "openai",
      modelId: config.transcribeModel,
    };
  } catch (err) {
    console.warn("[aria-provider] transcribeAudio failed:", err);
    return {
      transcript: "",
      llmUsed: false,
      providerId: "openai",
      modelId: config.transcribeModel,
    };
  }
}

// ─── Fallback when not configured ──────────────────────────────────────────

function ariaNotConfiguredFallback(expectJson: boolean): string {
  const message =
    "Aria is not configured in this environment. The provider key has not been set, so the universal Aria layer cannot generate text. Add OPENAI_API_KEY to your server environment to enable it. Domain engines that talk to Anthropic directly (oversight, voice of child, HR Process Guardian) continue to work with their own configuration.";
  if (expectJson) {
    return JSON.stringify({ ariaNotConfigured: true, message });
  }
  return `Aria suggested draft. ${message}`;
}
