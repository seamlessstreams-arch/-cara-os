// ══════════════════════════════════════════════════════════════════════════════
// ALERT FEEDBACK — capture one-tap reviewer feedback on surfaced attention items.
//
// Phase 1.1. Write path for `cara_alert_feedback`. Live-safe: on a live tenant it
// writes the real table (service_role); with Supabase disabled it reports
// not-persisted rather than throwing, so feedback is never a blocking action.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { tenantHomeId } from "@/lib/supabase/tenant";
import type { SB } from "@/lib/supabase/loose-client";

export const ALERT_VERDICTS = ["useful", "not_useful", "wrong"] as const;
export type AlertVerdict = (typeof ALERT_VERDICTS)[number];

export function isAlertVerdict(v: unknown): v is AlertVerdict {
  return typeof v === "string" && (ALERT_VERDICTS as readonly string[]).includes(v);
}

export interface AlertFeedbackInput {
  rule_id: string;
  entity_type?: string | null;
  entity_id?: string | null;
  verdict: AlertVerdict;
  note?: string | null;
  user_id?: string | null;
}

export interface AlertFeedbackResult {
  persisted: boolean;
  id?: string;
}

/** Record one feedback event. Best-effort: never throws on a storage error. */
export async function recordAlertFeedback(input: AlertFeedbackInput): Promise<AlertFeedbackResult> {
  if (!isSupabaseEnabled()) return { persisted: false };
  const c = createServerClient();
  if (!c) return { persisted: false };

  const { data, error } = await (c as unknown as SB)
    .from("cara_alert_feedback")
    .insert({
      home_id: tenantHomeId(),
      user_id: input.user_id ?? null,
      rule_id: input.rule_id,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      verdict: input.verdict,
      note: input.note ?? null,
    })
    .select("id")
    .single();

  if (error) return { persisted: false };
  return { persisted: true, id: (data as { id?: string } | null)?.id };
}
