// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — GOLDEN THREAD ENGINE
//
// Weaves a continuous evidence trail connecting events, decisions, actions
// and outcomes for every child. Each significant event creates a golden
// thread entry that links back to the source record.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type GoldenThreadInput = {
  homeId: string;
  childId?: string | null;
  eventType: string;
  title: string;
  summary: string;
  sourceTable: string;
  sourceId: string;
  eventDate?: string;
  createdBy?: string;
  childVoicePresent?: boolean;
  managementOversightPresent?: boolean;
  linkedRegulationRefs?: string[];
  linkedQualityStandardRefs?: string[];
};

export async function createGoldenThreadEvent(input: GoldenThreadInput) {
  if (!isSupabaseEnabled()) {
    return { id: "demo-golden-thread-id", ...input };
  }

  const sb = createServerClient();
  if (!sb) return { id: "demo-golden-thread-id", ...input };

  const requiresReview =
    !input.managementOversightPresent &&
    ["incident", "safeguarding", "missing", "restraint", "complaint", "allegation"].some((key) =>
      input.eventType.toLowerCase().includes(key)
    );

  const { data, error } = await (sb.from("golden_thread_events") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      event_type: input.eventType,
      title: input.title,
      summary: input.summary,
      event_date: input.eventDate ?? new Date().toISOString(),
      source_table: input.sourceTable,
      source_id: input.sourceId,
      linked_regulation_refs: input.linkedRegulationRefs ?? [],
      linked_quality_standard_refs: input.linkedQualityStandardRefs ?? [],
      child_voice_present: input.childVoicePresent ?? false,
      management_oversight_present: input.managementOversightPresent ?? false,
      requires_review: requiresReview,
      review_reason: requiresReview
        ? "This event appears to require management oversight or follow-up review."
        : null,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
