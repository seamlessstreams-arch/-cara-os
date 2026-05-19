// ══════════════════════════════════════════════════════════════════════════════
// Amendment Review Queue  (Milestone 19)
//
// CLAUDE.md spec: "Require manager review if the amendment affects
// safeguarding, incident, Regulation 40, Regulation 45 or Annex A evidence."
//
// Surfaces the current versions of care events where:
//   - version > 1 (i.e. the entry has been amended at least once), AND
//   - any sensitive flag is set
//       (is_safeguarding | requires_reg40_triage |
//        contributes_to_reg45 | contributes_to_annex_a), AND
//   - the amended record is not yet re-verified
//       (status NOT IN verified | locked).
//
// Each row includes a structured diff against the previous version so the
// reviewer can see exactly what changed before re-verifying.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CareEvent } from "@/types/care-events";

export type AmendmentSensitiveFlag =
  | "safeguarding"
  | "reg40"
  | "reg45"
  | "annex_a";

export interface AmendmentDiffField {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AmendmentReviewRow {
  care_event_id: string;
  home_id: string;
  child_id: string | null;
  version: number;
  previous_version_id: string | null;
  amendment_reason: string | null;
  amended_by: string | null;
  amended_at: string | null;
  status: CareEvent["status"];
  category: CareEvent["category"];
  title: string;
  event_date: string;
  sensitive_flags: AmendmentSensitiveFlag[];
  diff: AmendmentDiffField[];
}

export interface AmendmentReviewSummary {
  home_id: string;
  generated_at: string;
  total: number;
  by_flag: Record<AmendmentSensitiveFlag, number>;
  rows: AmendmentReviewRow[];
}

const AWAITING_STATUSES: CareEvent["status"][] = [
  "submitted",
  "routing",
  "routed",
  "manager_review_required",
  "returned",
  "routing_failed",
];

function sensitiveFlagsFor(e: CareEvent): AmendmentSensitiveFlag[] {
  const flags: AmendmentSensitiveFlag[] = [];
  if (e.is_safeguarding) flags.push("safeguarding");
  if (e.requires_reg40_triage) flags.push("reg40");
  if (e.contributes_to_reg45) flags.push("reg45");
  if (e.contributes_to_annex_a) flags.push("annex_a");
  return flags;
}

function diffEvents(prev: CareEvent | null | undefined, curr: CareEvent): AmendmentDiffField[] {
  if (!prev) return [];
  const fields: (keyof CareEvent)[] = [
    "title", "content", "category", "event_date", "event_time",
    "is_safeguarding", "requires_reg40_triage", "requires_manager_review",
    "contributes_to_reg45", "contributes_to_annex_a", "is_significant",
    "mood_score",
  ];
  const out: AmendmentDiffField[] = [];
  for (const f of fields) {
    const before = prev[f];
    const after = curr[f];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      out.push({ field: String(f), before, after });
    }
  }
  return out;
}

export function loadAmendmentReviewQueue(homeId: string): AmendmentReviewSummary {
  const rows: AmendmentReviewRow[] = [];
  const all = db.careEvents.findCurrent().filter((e) => e.home_id === homeId);

  for (const e of all) {
    if (e.version <= 1) continue;
    const flags = sensitiveFlagsFor(e);
    if (flags.length === 0) continue;
    if (!AWAITING_STATUSES.includes(e.status)) continue;

    const prev = e.previous_version_id
      ? db.careEvents.findById(e.previous_version_id) ?? null
      : null;

    rows.push({
      care_event_id: e.id,
      home_id: e.home_id,
      child_id: e.child_id,
      version: e.version,
      previous_version_id: e.previous_version_id,
      amendment_reason: e.amendment_reason,
      amended_by: e.amended_by,
      amended_at: e.amended_at,
      status: e.status,
      category: e.category,
      title: e.title,
      event_date: e.event_date,
      sensitive_flags: flags,
      diff: diffEvents(prev, e),
    });
  }

  // Most recent amendments first
  rows.sort((a, b) => (b.amended_at ?? "").localeCompare(a.amended_at ?? ""));

  const by_flag: Record<AmendmentSensitiveFlag, number> = {
    safeguarding: 0, reg40: 0, reg45: 0, annex_a: 0,
  };
  for (const r of rows) for (const f of r.sensitive_flags) by_flag[f] += 1;

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total: rows.length,
    by_flag,
    rows,
  };
}

export function amendmentReviewCount(homeId: string): number {
  return loadAmendmentReviewQueue(homeId).total;
}
