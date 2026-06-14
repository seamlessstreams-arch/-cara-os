// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — CHILD VOICE PROTECTION
//
// Detects and preserves child direct quotes, wishes, and feelings from
// free-text records. Ensures the child's voice is never polished away
// or misrepresented by AI processing.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export function detectChildVoice(text: string): {
  hasDirectQuote: boolean;
  possibleQuotes: string[];
  warning?: string;
} {
  const quoteMatches = text.match(/["""]([^"""]{3,240})["""]/g) ?? [];
  const possibleQuotes = quoteMatches.map((q) => q.replace(/["""""]/g, "").trim());

  return {
    hasDirectQuote: possibleQuotes.length > 0,
    possibleQuotes,
    warning: possibleQuotes.length === 0
      ? "No direct child voice detected. Consider whether the child's wishes and feelings should be recorded."
      : undefined,
  };
}

export async function createChildVoiceSegment(input: {
  homeId: string;
  childId: string;
  sourceTable: string;
  sourceId: string;
  directQuote?: string;
  paraphrasedWishesFeelings?: string;
  staffObservation?: string;
  staffInterpretation?: string;
  actionTaken?: string;
  aiDetected?: boolean;
}) {
  if (!isSupabaseEnabled()) {
    return { id: "demo-child-voice-id", ...input };
  }

  const sb = createServerClient();
  if (!sb) return { id: "demo-child-voice-id", ...input };

  const { data, error } = await (sb.from("child_voice_segments") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      source_table: input.sourceTable,
      source_id: input.sourceId,
      direct_quote: input.directQuote,
      paraphrased_wishes_feelings: input.paraphrasedWishesFeelings,
      staff_observation: input.staffObservation,
      staff_interpretation: input.staffInterpretation,
      action_taken: input.actionTaken,
      ai_detected: input.aiDetected ?? false,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
