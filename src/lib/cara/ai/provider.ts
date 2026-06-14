// ══════════════════════════════════════════════════════════════════════════════
// Cara REPORTS — AI PROVIDER
//
// Wraps the existing multi-provider layer (OpenAI / Anthropic / Gemini / stub)
// with Cara-specific safety controls. Every call through this module:
//
//   1. Prepends CARA_SYSTEM_PREAMBLE to the system prompt
//   2. Delegates to generateStudioContent from cara-studio
//   3. Runs sanitiseOutput on the response
//   4. Returns a structured CaraAIResponse
//
// Also provides generateCaraJSON<T>() for structured output with Zod
// validation — the standard path for report section generation, challenge
// mode, and suggested actions.
//
// Server-side only — never import in client components.
// ══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import { generateStudioContent } from "@/lib/cara-studio/ai-provider.service";
import { CARA_SYSTEM_PREAMBLE, sanitiseOutput } from "./safety";

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface CaraAIRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CaraAIResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
  wasSanitised: boolean;
}

// ── generateCaraContent ────────────────────────────────────────────────────
// Primary text generation entry point for Cara Reports. Prepends the safety
// preamble, calls the shared provider, and sanitises the output.

export async function generateCaraContent(request: CaraAIRequest): Promise<CaraAIResponse> {
  const fullSystemPrompt = `${CARA_SYSTEM_PREAMBLE}\n\n${request.systemPrompt}`;

  try {
    const result = await generateStudioContent(fullSystemPrompt, request.userPrompt, {
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });

    const sanitised = sanitiseOutput(result.content);
    const wasSanitised = sanitised !== result.content;

    return {
      content: sanitised,
      model: result.model,
      provider: result.provider,
      tokensUsed: result.tokens_used,
      wasSanitised,
    };
  } catch (err) {
    console.error("[cara-reports] AI generation failed:", err);

    return {
      content:
        "Cara was unable to generate content at this time. The AI provider returned an error. " +
        "Please retry or contact your system administrator if the problem persists. " +
        "This section requires manual completion by the reviewing manager.",
      model: "unavailable",
      provider: "error",
      tokensUsed: 0,
      wasSanitised: false,
    };
  }
}

// ── generateCaraJSON ───────────────────────────────────────────────────────
// Calls generateCaraContent, parses the result as JSON, and validates against
// the provided Zod schema. Returns the validated data or an error message.
//
// The AI prompt should instruct the model to return valid JSON. This function
// handles markdown code fences (```json ... ```) that models sometimes wrap
// their output in.

export async function generateCaraJSON<T>(
  request: CaraAIRequest,
  schema: z.ZodSchema<T>,
): Promise<{ data: T | null; raw: string; error?: string }> {
  const response = await generateCaraContent(request);
  const raw = response.content;

  // Strip markdown code fences if present.
  let jsonString = raw.trim();
  const fenceMatch = jsonString.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    jsonString = fenceMatch[1].trim();
  }

  // Attempt JSON parse.
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      data: null,
      raw,
      error: `AI response was not valid JSON. Raw content starts with: "${raw.slice(0, 120)}..."`,
    };
  }

  // Validate against the Zod schema.
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return {
      data: null,
      raw,
      error: `AI response failed schema validation: ${issues}`,
    };
  }

  return { data: result.data, raw };
}
