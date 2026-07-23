// ══════════════════════════════════════════════════════════════════════════════
// Inspection Bundle Diff  (Milestone 44)
//
// Pure comparison of two persisted bundles. Read-only over the in-memory
// store; reports headline deltas and evidence churn (added / removed)
// so inspectors and RIs see what changed between visits.
//
// Same shape both ways: previous_id -> current_id. If `previous_id` is null
// (first ever bundle), every counter delta equals the current value and
// every evidence row is reported as "added".
// ══════════════════════════════════════════════════════════════════════════════

import {
  getPersistedInspectionBundle,
  type InspectionBundle,
} from "@/lib/care-events/inspection-bundle";

export interface BundleHeadlineDelta {
  reg44_packs_included:     { previous: number; current: number; delta: number };
  filing_total:             { previous: number; current: number; delta: number };
  reg45_evidence_items:     { previous: number; current: number; delta: number };
  annex_a_evidence_items:   { previous: number; current: number; delta: number };
  recent_exports_included:  { previous: number; current: number; delta: number };
  // previous/current/delta are null when either bundle had no measurable readiness.
  readiness_score:          { previous: number | null; current: number | null; delta: number | null };
  readiness_severity:       { previous: string; current: string; changed: boolean };
  trajectory_alerts_open:   { previous: number; current: number; delta: number };
  trajectory_acks_recent:   { previous: number; current: number; delta: number };
}

export interface EvidenceChurn<T> {
  added: T[];
  removed: T[];
  unchanged_count: number;
}

export interface InspectionBundleDiff {
  previous_id: string | null;
  current_id: string;
  generated_at: string;
  home_id: string;
  headline: BundleHeadlineDelta;
  reg45_evidence: EvidenceChurn<{ id: string }>;
  annex_a_evidence: EvidenceChurn<{ id: string }>;
  reg44_packs: EvidenceChurn<{ id: string }>;
  // Coarse summary fields suitable for inline UI
  notable_changes: string[];
}

const ZERO_PAYLOAD: Pick<
  InspectionBundle["headline"],
  | "reg44_packs_included"
  | "filing_total"
  | "reg45_evidence_items"
  | "annex_a_evidence_items"
  | "recent_exports_included"
  | "readiness_score"
  | "trajectory_alerts_open"
  | "trajectory_acks_recent"
> = {
  reg44_packs_included: 0,
  filing_total: 0,
  reg45_evidence_items: 0,
  annex_a_evidence_items: 0,
  recent_exports_included: 0,
  readiness_score: 0,
  trajectory_alerts_open: 0,
  trajectory_acks_recent: 0,
};

function ids(rows: ReadonlyArray<unknown>): string[] {
  return rows
    .map((r) => (r as { id?: string; bundle_id?: string }).id ?? (r as { bundle_id?: string }).bundle_id)
    .filter((x): x is string => typeof x === "string");
}

function churn(prevIds: string[], currIds: string[]): EvidenceChurn<{ id: string }> {
  const prev = new Set(prevIds);
  const curr = new Set(currIds);
  const added = [...curr].filter((id) => !prev.has(id)).map((id) => ({ id }));
  const removed = [...prev].filter((id) => !curr.has(id)).map((id) => ({ id }));
  const unchanged_count = [...curr].filter((id) => prev.has(id)).length;
  return { added, removed, unchanged_count };
}

export function diffInspectionBundles(
  currentId: string,
  previousId: string | null,
): InspectionBundleDiff | null {
  const currentRow = getPersistedInspectionBundle(currentId);
  if (!currentRow) return null;
  const current = currentRow.payload as InspectionBundle;

  const previousRow = previousId ? getPersistedInspectionBundle(previousId) : null;
  const previous = previousRow?.payload as InspectionBundle | undefined;
  if (previousId && !previous) return null;

  const prevHead = previous?.headline ?? {
    ...ZERO_PAYLOAD,
    inspection_snapshots_included: 0,
    readiness_severity: "unknown",
  };
  const ch = current.headline;

  const headline: BundleHeadlineDelta = {
    reg44_packs_included:    diffNum(prevHead.reg44_packs_included,   ch.reg44_packs_included),
    filing_total:            diffNum(prevHead.filing_total,           ch.filing_total),
    reg45_evidence_items:    diffNum(prevHead.reg45_evidence_items,   ch.reg45_evidence_items),
    annex_a_evidence_items:  diffNum(prevHead.annex_a_evidence_items, ch.annex_a_evidence_items),
    recent_exports_included: diffNum(prevHead.recent_exports_included,ch.recent_exports_included),
    readiness_score:         diffScore(prevHead.readiness_score,      ch.readiness_score),
    readiness_severity: {
      previous: prevHead.readiness_severity,
      current:  ch.readiness_severity,
      changed:  prevHead.readiness_severity !== ch.readiness_severity,
    },
    trajectory_alerts_open:  diffNum(prevHead.trajectory_alerts_open  ?? 0, ch.trajectory_alerts_open  ?? 0),
    trajectory_acks_recent:  diffNum(prevHead.trajectory_acks_recent  ?? 0, ch.trajectory_acks_recent  ?? 0),
  };

  const reg45 = churn(
    previous ? ids(previous.reg45_evidence) : [],
    ids(current.reg45_evidence),
  );
  const annex = churn(
    previous ? ids(previous.annex_a_evidence) : [],
    ids(current.annex_a_evidence),
  );
  const reg44 = churn(
    previous ? ids(previous.reg44_packs) : [],
    ids(current.reg44_packs),
  );

  const notable: string[] = [];
  if (headline.readiness_severity.changed) {
    notable.push(
      `Readiness severity changed: ${headline.readiness_severity.previous} → ${headline.readiness_severity.current}`,
    );
  }
  if (headline.readiness_score.delta !== null && headline.readiness_score.delta !== 0) {
    const sign = headline.readiness_score.delta > 0 ? "+" : "";
    notable.push(`Readiness score ${sign}${headline.readiness_score.delta}`);
  }
  if (reg45.added.length || reg45.removed.length) {
    notable.push(`Reg 45 evidence: +${reg45.added.length} / -${reg45.removed.length}`);
  }
  if (annex.added.length || annex.removed.length) {
    notable.push(`Annex A evidence: +${annex.added.length} / -${annex.removed.length}`);
  }
  if (reg44.added.length || reg44.removed.length) {
    notable.push(`Reg 44 packs: +${reg44.added.length} / -${reg44.removed.length}`);
  }
  if (notable.length === 0) {
    notable.push("No notable changes between bundles.");
  }

  return {
    previous_id: previousId,
    current_id: currentId,
    generated_at: new Date().toISOString(),
    home_id: current.home_id,
    headline,
    reg45_evidence: reg45,
    annex_a_evidence: annex,
    reg44_packs: reg44,
    notable_changes: notable,
  };
}

function diffNum(previous: number, current: number) {
  return { previous, current, delta: current - previous };
}

// A delta between readiness scores is only meaningful when both are measured.
function diffScore(previous: number | null, current: number | null) {
  const delta = previous !== null && current !== null ? current - previous : null;
  return { previous, current, delta };
}
