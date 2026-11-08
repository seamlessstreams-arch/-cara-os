// ══════════════════════════════════════════════════════════════════════════════
// SUGGESTION OUTCOMES — capture whether an AI/deterministic suggestion was
// accepted, dismissed or escalated (smart links, early warnings, pattern alerts).
//
// Phase 1.2. Write path for `cara_suggestion_outcomes`. Live-safe: writes the
// real table on a live tenant; reports not-persisted (never throws) when
// Supabase is off, so acting on a suggestion is never blocked by the capture.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { tenantHomeId } from "@/lib/supabase/tenant";
import type { SB } from "@/lib/supabase/loose-client";

export const SUGGESTION_TYPES = ["smart_link", "early_warning", "pattern_alert"] as const;
export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export const SUGGESTION_OUTCOMES = ["accepted", "dismissed", "escalated"] as const;
export type SuggestionOutcome = (typeof SUGGESTION_OUTCOMES)[number];

export function isSuggestionType(v: unknown): v is SuggestionType {
  return typeof v === "string" && (SUGGESTION_TYPES as readonly string[]).includes(v);
}
export function isSuggestionOutcome(v: unknown): v is SuggestionOutcome {
  return typeof v === "string" && (SUGGESTION_OUTCOMES as readonly string[]).includes(v);
}

export interface SuggestionOutcomeInput {
  suggestion_type: SuggestionType;
  suggestion_ref: string;
  outcome: SuggestionOutcome;
  note?: string | null;
  user_id?: string | null;
}

export interface SuggestionOutcomeResult {
  persisted: boolean;
  id?: string;
}

/** Record one suggestion outcome. Best-effort: never throws on a storage error. */
export async function recordSuggestionOutcome(input: SuggestionOutcomeInput): Promise<SuggestionOutcomeResult> {
  if (!isSupabaseEnabled()) return { persisted: false };
  const c = createServerClient();
  if (!c) return { persisted: false };

  const { data, error } = await (c as unknown as SB)
    .from("cara_suggestion_outcomes")
    .insert({
      home_id: tenantHomeId(),
      user_id: input.user_id ?? null,
      suggestion_type: input.suggestion_type,
      suggestion_ref: input.suggestion_ref,
      outcome: input.outcome,
      note: input.note ?? null,
    })
    .select("id")
    .single();

  if (error) return { persisted: false };
  return { persisted: true, id: (data as { id?: string } | null)?.id };
}
